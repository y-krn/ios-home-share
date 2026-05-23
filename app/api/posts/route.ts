import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import sharp from 'sharp'
import ExifParser from 'exif-parser'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeScreenshotFromBase64, type ExtractedTags, type BoundingBox } from '@/lib/gemini'
import { lookupApps } from '@/lib/app-store'

async function applyRedaction(
  imageBuffer: Buffer,
  boxes: BoundingBox[]
): Promise<Buffer> {
  if (!boxes || boxes.length === 0) return imageBuffer

  try {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width ?? 1080
    const height = metadata.height ?? 1920

    const solidBoxes = boxes.filter(b => b.label === 'notification_badge')
    const blurBoxes = boxes.filter(b => b.label === 'sensitive_text')

    let currentBuffer = imageBuffer

    // 1. Apply solid blackout to notification_badge
    if (solidBoxes.length > 0) {
      const svgRects = solidBoxes.map((box) => {
        const x = (box.xmin / 1000) * width
        const y = (box.ymin / 1000) * height
        const w = ((box.xmax - box.xmin) / 1000) * width
        const h = ((box.ymax - box.ymin) / 1000) * height

        let rx = 10
        let ry = 10
        if (box.label === 'notification_badge') {
          rx = Math.min(w, h) / 2
          ry = Math.min(w, h) / 2
        }

        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${ry}" fill="black" />`
      })

      const svgOverlay = `<svg width="${width}" height="${height}">${svgRects.join('')}</svg>`
      currentBuffer = await sharp(currentBuffer)
        .composite([{ input: Buffer.from(svgOverlay), blend: 'over' }])
        .toBuffer()
    }

    // 2. Apply gaussian blur overlay to sensitive_text blocks
    if (blurBoxes.length > 0) {
      const blurredImage = await sharp(currentBuffer).blur(20).toBuffer()

      const svgRects = blurBoxes.map((box) => {
        const x = (box.xmin / 1000) * width
        const y = (box.ymin / 1000) * height
        const w = ((box.xmax - box.xmin) / 1000) * width
        const h = ((box.ymax - box.ymin) / 1000) * height
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="black" />`
      })

      const svgMask = `<svg width="${width}" height="${height}">${svgRects.join('')}</svg>`

      const maskedBlur = await sharp(blurredImage)
        .composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }])
        .toBuffer()

      const maskedOriginal = await sharp(currentBuffer)
        .composite([{ input: Buffer.from(svgMask), blend: 'dest-out' }])
        .toBuffer()

      currentBuffer = await sharp(maskedOriginal)
        .composite([{ input: maskedBlur, blend: 'over' }])
        .toBuffer()
    }

    return currentBuffer
  } catch (e) {
    console.error('Redaction failed, proceeding with original buffer:', e)
    return imageBuffer
  }
}

const BUCKET = 'screenshots'
type Locale = 'ja' | 'en'

export const maxDuration = 60

function getLocale(req: NextRequest): Locale {
  return new URL(req.url).searchParams.get('locale') === 'en' ? 'en' : 'ja'
}

function message(locale: Locale, ja: string, en: string) {
  return locale === 'en' ? en : ja
}

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const tag = searchParams.get('tag')
  const trackId = searchParams.get('trackId')
  const theme = searchParams.get('theme')
  const type = searchParams.get('type')
  const limit = 20

  if (trackId) {
    const { data, error } = await admin.rpc('posts_by_track_id', { track_id: trackId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const posts = (data ?? [])
      .filter((post: { created_at: string }) => !cursor || post.created_at < cursor)
      .slice(0, limit)

    return NextResponse.json(posts)
  }

  let query = admin
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) query = query.lt('created_at', cursor)
  if (tag) {
    const column = type === 'widget' ? 'widgets' : 'apps'
    query = query.contains(`extracted_tags->${column}`, JSON.stringify([tag]))
  }
  if (theme) query = query.eq('extracted_tags->>theme', theme)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const locale = getLocale(req)

  try {
    // session認証 (匿名は拒否)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: message(locale, '認証が必要です', 'Login is required.') }, { status: 401 })
    if (user.is_anonymous) return NextResponse.json({ error: message(locale, '投稿にはメール認証が必要です', 'Email login is required to post.') }, { status: 403 })

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

    // Apply privacy redactions if boxes are detected
    let finalBuffer = compressedBuffer
    if (extractedTags.redaction_boxes && extractedTags.redaction_boxes.length > 0) {
      finalBuffer = await applyRedaction(compressedBuffer, extractedTags.redaction_boxes)
    }

    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, finalBuffer, { contentType: 'image/webp', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
    const imageUrl = urlData.publicUrl

    const { data, error } = await admin
      .from('posts')
      .insert({
        image_url: imageUrl,
        image_path: path,
        anon_user_id: user.id,
        extracted_tags: extractedTags,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/')
    revalidateTag('home-posts', 'max')

    // temp 削除 (失敗しても本処理は成功扱い)
    await admin.storage.from(BUCKET).remove([tempPath]).catch(() => {})

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('post error:', e)
    return NextResponse.json({ error: message(locale, 'アップロードに失敗しました', 'Upload failed. Please try again.') }, { status: 500 })
  }
}
