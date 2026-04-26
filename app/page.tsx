import { createAdminClient } from '@/lib/supabase/admin'
import { PostGrid } from '@/components/PostGrid'
import { lookupApp } from '@/lib/app-store'

type Props = {
  searchParams: Promise<{ tag?: string; theme?: string; type?: string }>
}

export const revalidate = 0

export default async function Home({ searchParams }: Props) {
  const { tag, theme, type } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (tag) {
    const column = type === 'widget' ? 'widgets' : 'apps'
    query = query.contains(`extracted_tags->${column}`, JSON.stringify([tag]))
  }
  if (theme) query = query.eq('extracted_tags->>theme', theme)

  const { data: posts } = await query

  // タグ正式名解決 (iTunes API)
  const tagInfo = tag ? await lookupApp(tag) : null
  const displayTag = tagInfo?.trackName ?? tag

  return (
    <div className="space-y-5">
      {!tag && !theme && (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">タイムライン</h1>
          <p className="text-sm text-muted">みんなのホーム画面を覗き見</p>
        </div>
      )}
      {(tag || theme) && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted text-xs">フィルター</span>
          {tag && <span className="glass-soft px-3 py-1 rounded-full text-xs font-medium">{displayTag}</span>}
          {theme && <span className="glass-soft px-3 py-1 rounded-full text-xs font-medium">{theme}</span>}
          <a href="/" className="text-muted hover:text-accent text-xs underline">クリア</a>
        </div>
      )}
      <PostGrid initialPosts={posts ?? []} tag={tag} theme={theme} />
    </div>
  )
}
