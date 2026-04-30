import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'screenshots'

export async function POST() {
  // 認証 (匿名拒否)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (user.is_anonymous) return NextResponse.json({ error: 'login required' }, { status: 403 })

  // サーバ側で path 生成 (path injection 防止)
  const path = `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.bin`

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) {
    console.error('createSignedUploadUrl failed:', error)
    return NextResponse.json({ error: 'signed url生成失敗' }, { status: 500 })
  }

  return NextResponse.json({ token: data.token, path: data.path })
}
