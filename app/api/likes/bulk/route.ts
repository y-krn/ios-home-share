import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return NextResponse.json({})

  const ids = req.nextUrl.searchParams.getAll('id')
  if (!ids.length) return NextResponse.json({})

  const admin = createAdminClient()
  const { data } = await admin
    .from('likes')
    .select('post_id')
    .eq('anon_user_id', user.id)
    .in('post_id', ids)

  const result: Record<string, boolean> = {}
  for (const row of data ?? []) result[row.post_id] = true
  return NextResponse.json(result)
}
