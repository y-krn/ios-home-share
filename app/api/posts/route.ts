import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import ExifParser from 'exif-parser'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeScreenshotFromBase64, type ExtractedTags } from '@/lib/gemini'
import { lookupApps } from '@/lib/app-store'

const BUCKET = 'screenshots'

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const tag = searchParams.get('tag')
  const theme = searchParams.get('theme')
  const type = searchParams.get('type')
  const limit = 20

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
  try {
    // session認証
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

    const admin = createAdminClient()

    // 原本Buffer取得
    const originalBuffer = Buffer.from(await file.arrayBuffer())
    const originalMime = file.type || 'image/png'

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
        { error: 'カメラで撮影した写真は投稿できません。スクリーンショットを使用してください。' },
        { status: 400 }
      )
    }
    if (aspect >= 0.7) {
      return NextResponse.json(
        { error: 'iOSホーム画面の縦長スクリーンショットを使用してください。' },
        { status: 400 }
      )
    }

    // AI解析 + ホーム画面判定
    let extractedTags: ExtractedTags & {
      app_links?: Record<string, unknown>
      widget_links?: Record<string, unknown>
    } = {} as ExtractedTags
    try {
      extractedTags = await analyzeScreenshotFromBase64(
        originalBuffer.toString('base64'),
        originalMime,
      )
    } catch (e) {
      console.error('AI analysis failed:', e)
      return NextResponse.json({ error: 'AI解析に失敗しました。再試行してください。' }, { status: 500 })
    }

    // ホーム画面以外 → 拒否
    if (!extractedTags.is_home_screen) {
      return NextResponse.json(
        { error: 'iOSホーム画面のスクリーンショットのみ投稿可能です。' },
        { status: 400 }
      )
    }

    const allApps = [...(extractedTags.apps ?? []), ...(extractedTags.dock_apps ?? [])]
    const uniqueApps = Array.from(new Set(allApps))
    if (uniqueApps.length > 0) {
      extractedTags.app_links = await lookupApps(uniqueApps)
    }
    const uniqueWidgets = Array.from(new Set(extractedTags.widgets ?? []))
    if (uniqueWidgets.length > 0) {
      extractedTags.widget_links = await lookupApps(uniqueWidgets)
    }

    // sharp 圧縮
    const compressedBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, compressedBuffer, { contentType: 'image/webp', upsert: false })

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

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('post error:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
