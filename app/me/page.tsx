import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { PostGrid } from '@/components/PostGrid'

export const revalidate = 0

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function MyPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === 'liked' ? 'liked' : 'mine'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/me')

  const admin = createAdminClient()

  let posts: unknown[] = []
  if (activeTab === 'mine') {
    const { data } = await admin
      .from('posts')
      .select('*')
      .eq('anon_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    posts = data ?? []
  } else {
    // いいねした投稿: likes JOIN posts
    const { data } = await admin
      .from('likes')
      .select('post_id, created_at, posts(*)')
      .eq('anon_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    posts = (data ?? []).map((l: { posts: unknown }) => l.posts).filter(Boolean)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">マイページ</h1>

      <div className="glass-soft rounded-full p-1 inline-flex">
        <Link
          href="/me"
          className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${
            activeTab === 'mine'
              ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          自分の投稿
        </Link>
        <Link
          href="/me?tab=liked"
          className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${
            activeTab === 'liked'
              ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          いいね
        </Link>
      </div>

      {posts.length > 0 ? (
        <PostGrid initialPosts={posts as never} showEdit={activeTab === 'mine'} />
      ) : (
        <div className="text-center py-20 space-y-4">
          <p className="text-muted">
            {activeTab === 'mine' ? 'まだ投稿がありません' : 'まだいいねがありません'}
          </p>
          {activeTab === 'mine' && (
            <Link href="/upload" className="inline-block px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
              ホーム画面を投稿する
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
