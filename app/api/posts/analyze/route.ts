import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import ExifParser from 'exif-parser'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeScreenshotFromBase64, type ExtractedTags } from '@/lib/gemini'
import { lookupApps } from '@/lib/app-store'

const BUCKET = 'screenshots'
type Locale = 'ja' | 'en'

function getLocale(req: NextRequest): Locale {
  return new URL(req.url).searchParams.get('locale') === 'en' ? 'en' : 'ja'
}

function message(locale: Locale, ja: string, en: string) {
  return locale === 'en' ? en : ja
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const locale = getLocale(req)

  try {
    // 解析プレビュー用。メール未認証の匿名セッションも許可。
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: message(locale, '認証が必要です', 'Login is required.') }, { status: 401 })

    const body = await req.json().catch(() => null) as { path?: string } | null
    const tempPath = body?.path
    if (!tempPath || !tempPath.startsWith('temp/')) {
      return NextResponse.json({ error: message(locale, 'アップロード情報が不正です', 'The upload information is invalid.') }, { status: 400 })
    }

    const admin = createAdminClient()

    // Storage から原本ダウンロード
    const { data: blob, error: dlError } = await admin.storage.from(BUCKET).download(tempPath)
    if (dlError || !blob) {
      console.error('download failed:', dlError)
      return NextResponse.json({ error: message(locale, 'アップロード済みファイルが見つかりません', 'Could not find the uploaded file. Please try again.') }, { status: 400 })
    }
    const originalBuffer = Buffer.from(await blob.arrayBuffer())
    const originalMime = blob.type || 'image/png'

    // 事前判定: 写真 (EXIFカメラ情報あり) or 横長画像 → Gemini呼ばずreject
    const meta = await sharp(originalBuffer).metadata()
    const aspect = (meta.width ?? 1) / (meta.height ?? 1)

    let hasCamera = false
    if (originalMime === 'image/jpeg' || originalMime === 'image/jpg') {
      try {
        const parser = ExifParser.create(originalBuffer)
        const exif = parser.parse()
        const tags = exif.tags as { Make?: string; Model?: string } | undefined
        hasCamera = !!(tags?.Make || tags?.Model)
      } catch {
        // EXIF parse失敗 → 無視
      }
    }

    if (hasCamera) {
      return NextResponse.json(
        { error: message(locale, 'カメラで撮影した写真は投稿できません。スクリーンショットを使用してください。', 'Photos taken with a camera cannot be posted. Please upload an iPhone screenshot.') },
        { status: 400 }
      )
    }
    if (aspect >= 0.7) {
      return NextResponse.json(
        { error: message(locale, 'iOSホーム画面の縦長スクリーンショットを使用してください。', 'Please upload a vertical iPhone home screen or lock screen screenshot.') },
        { status: 400 }
      )
    }

    // sharp 圧縮 (Gemini入力 + 最終保存 兼用)
    const compressedBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    // AI解析 + 投稿対象判定
    let extractedTags: ExtractedTags & {
      app_links?: Record<string, unknown>
      widget_links?: Record<string, unknown>
    } = {} as ExtractedTags
    try {
      extractedTags = await analyzeScreenshotFromBase64(
        compressedBuffer.toString('base64'),
        'image/webp',
      )
    } catch (e) {
      console.error('AI analysis failed:', e)
      return NextResponse.json({ error: message(locale, 'AI解析に失敗しました。再試行してください。', 'Could not analyze the screenshot. Please try again.') }, { status: 500 })
    }

    const isHomeScreen = extractedTags.is_home_screen || extractedTags.screen_type === 'home'
    const isLockScreen = extractedTags.is_lock_screen || extractedTags.screen_type === 'lock'
    const isAllowedScreen = isHomeScreen || isLockScreen

    // ホーム画面・ロック画面以外 → 拒否
    if (!isAllowedScreen) {
      return NextResponse.json(
        { error: message(locale, 'iOSホーム画面またはロック画面のスクリーンショットのみ投稿可能です。', 'Only iPhone home screen or lock screen screenshots can be posted.') },
        { status: 400 }
      )
    }

    if (isLockScreen) {
      extractedTags.screen_type = 'lock'
      extractedTags.is_lock_screen = true
      extractedTags.is_home_screen = false
      extractedTags.apps = []
      extractedTags.dock_apps = []
    } else {
      extractedTags.screen_type = 'home'
      extractedTags.is_home_screen = true
      extractedTags.is_lock_screen = false
    }

    // iTunes lookup 並列化
    const allApps = [...(extractedTags.apps ?? []), ...(extractedTags.dock_apps ?? [])]
    const uniqueApps = Array.from(new Set(allApps))
    const uniqueWidgets = Array.from(new Set(extractedTags.widgets ?? []))
    const [appLinks, widgetLinks] = await Promise.all([
      uniqueApps.length > 0 ? lookupApps(uniqueApps) : Promise.resolve(undefined),
      uniqueWidgets.length > 0 ? lookupApps(uniqueWidgets) : Promise.resolve(undefined),
    ])
    if (appLinks) extractedTags.app_links = appLinks
    if (widgetLinks) extractedTags.widget_links = widgetLinks

    // 保存先をtemp/下のoriginalにする
    const tempOriginalPath = `temp/original-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(tempOriginalPath, compressedBuffer, { contentType: 'image/webp', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(tempOriginalPath)
    const imageUrl = urlData.publicUrl

    // temp の原本 (.bin) 削除
    await admin.storage.from(BUCKET).remove([tempPath]).catch(() => {})

    return NextResponse.json({
      tempOriginalPath,
      imageUrl,
      extractedTags,
    }, { status: 200 })

  } catch (e) {
    console.error('post analyze error:', e)
    return NextResponse.json({ error: message(locale, '解析に失敗しました', 'Analysis failed. Please try again.') }, { status: 500 })
  }
}
