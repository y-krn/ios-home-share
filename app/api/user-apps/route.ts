import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Locale = 'ja' | 'en'

function getLocale(req: NextRequest): Locale {
  return new URL(req.url).searchParams.get('locale') === 'en' ? 'en' : 'ja'
}

function message(locale: Locale, ja: string, en: string) {
  return locale === 'en' ? en : ja
}

export async function POST(req: NextRequest) {
  const locale = getLocale(req)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: message(locale, 'ログインが必要です', 'Login is required.') }, { status: 401 })
    }
    if (user.is_anonymous) {
      return NextResponse.json({ error: message(locale, 'メールログインが必要です', 'Email login is required.') }, { status: 403 })
    }

    const body = await req.json().catch(() => null) as {
      trackId?: string
      appName?: string
      artworkUrl?: string
    } | null

    const trackId = body?.trackId?.toString()
    const appName = body?.appName
    const artworkUrl = body?.artworkUrl

    if (!trackId || !appName || !artworkUrl) {
      return NextResponse.json({ error: message(locale, 'パラメータが不足しています', 'Missing parameters.') }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('user_apps')
      .insert({
        user_id: user.id,
        track_id: trackId,
        app_name: appName,
        artwork_url: artworkUrl,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique violation (already exists) - return 200 ok
        return NextResponse.json({ success: true, message: 'Already marked' })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error adding user app:', error)
    return NextResponse.json({ error: message(locale, 'エラーが発生しました', 'Internal server error.') }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const locale = getLocale(req)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: message(locale, 'ログインが必要です', 'Login is required.') }, { status: 401 })
    }
    if (user.is_anonymous) {
      return NextResponse.json({ error: message(locale, 'メールログインが必要です', 'Email login is required.') }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const trackId = searchParams.get('trackId')

    if (!trackId) {
      return NextResponse.json({ error: message(locale, 'trackIdを指定してください', 'Missing trackId parameter.') }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('user_apps')
      .delete()
      .eq('user_id', user.id)
      .eq('track_id', trackId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user app:', error)
    return NextResponse.json({ error: message(locale, 'エラーが発生しました', 'Internal server error.') }, { status: 500 })
  }
}
