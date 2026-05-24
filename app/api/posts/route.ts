import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type ExtractedTags } from '@/lib/gemini'

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

  const ownedApps = searchParams.get('ownedApps')
  if (ownedApps) {
    const appsList = ownedApps.split(',').map(s => s.trim()).filter(Boolean)
    if (appsList.length > 0) {
      const orConditions = appsList.flatMap(app => [
        `extracted_tags->apps.cs.${JSON.stringify([app])}`,
        `extracted_tags->dock_apps.cs.${JSON.stringify([app])}`
      ]).join(',')
      query = query.or(orConditions)
    }
  } else if (tag) {
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

    const body = await req.json().catch(() => null) as {
      tempRedactedPath?: string
      extractedTags?: ExtractedTags
    } | null

    const tempRedactedPath = body?.tempRedactedPath
    const extractedTags = body?.extractedTags

    if (!tempRedactedPath || !tempRedactedPath.startsWith('temp/redacted-') || !extractedTags) {
      return NextResponse.json({ error: message(locale, 'アップロード情報が不正です', 'The upload information is invalid.') }, { status: 400 })
    }

    const admin = createAdminClient()

    // 確定された保存先パスの生成
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

    // ファイルを移動する
    const { error: moveError } = await admin.storage
      .from(BUCKET)
      .move(tempRedactedPath, path)

    if (moveError) {
      console.error('Move storage file failed:', moveError)
      return NextResponse.json({ error: message(locale, '画像の確定処理に失敗しました', 'Failed to publish the image.') }, { status: 500 })
    }

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

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('post error:', e)
    return NextResponse.json({ error: message(locale, 'アップロードに失敗しました', 'Upload failed. Please try again.') }, { status: 500 })
  }
}
