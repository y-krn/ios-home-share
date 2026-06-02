import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { PostGrid } from '@/components/PostGrid'
import { Hero } from '@/components/Hero'
import { AppIconBackdrop } from '@/components/AppIconBackdrop'
import { lookupApp } from '@/lib/app-store'
import { unstable_cache } from 'next/cache'
import { getPopularApps } from '@/lib/popular-apps'

type Props = {
  searchParams: Promise<{ tag?: string; theme?: string; type?: string }>
}

export const revalidate = 60

const getCachedPosts = unstable_cache(
  async (tag?: string, theme?: string, type?: string) => {
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

    const { data } = await query
    return data ?? []
  },
  ['home-posts'],
  { revalidate: 60, tags: ['home-posts'] },
)

export default async function Home({ searchParams }: Props) {
  const { tag, theme, type } = await searchParams

  // 直列フェッチを並列化して初期ロード速度を向上
  const [posts, popularApps, tagInfo] = await Promise.all([
    getCachedPosts(tag, theme, type),
    getPopularApps(15),
    tag ? lookupApp(tag) : Promise.resolve(null),
  ])

  const displayTag = tagInfo?.trackName ?? tag

  return (
    <div className="space-y-8">
      <AppIconBackdrop />
      {!tag && !theme && <Hero />}
      {(tag || theme) && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted text-xs">フィルター</span>
          {tag && <span className="glass-soft px-3 py-1 rounded-full text-xs font-medium">{displayTag}</span>}
          {theme && <span className="glass-soft px-3 py-1 rounded-full text-xs font-medium">{theme}</span>}
          <Link href="/" className="text-muted hover:text-accent text-xs underline">クリア</Link>
        </div>
      )}
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            Latest setups
          </p>
          <h2 className="text-2xl font-black">投稿を開いて解析結果を見る</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            スクショをタップすると、使っているアプリ・ウィジェット・壁紙カラー・Dockまで確認できます。
          </p>
        </div>
        <PostGrid initialPosts={posts} tag={tag} theme={theme} type={type} popularApps={popularApps} />
      </section>
    </div>
  )
}
