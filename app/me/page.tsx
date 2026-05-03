import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Grid2X2, Heart, ImagePlus, UserRound } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
          <UserRound size={13} />
          My Gallery
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">マイページ</h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed">
            自分の投稿と、あとで見返したいiPhone画面をまとめて確認できます。
          </p>
        </div>
      </div>

      <div className="gallery-caption rounded-full p-1 inline-flex">
        <Link
          href="/me"
          className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'mine'
              ? 'bg-accent text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Grid2X2 size={14} />
          自分の投稿
        </Link>
        <Link
          href="/me?tab=liked"
          className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'liked'
              ? 'bg-accent text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Heart size={14} />
          いいね
        </Link>
      </div>

      {posts.length > 0 ? (
        <PostGrid initialPosts={posts as never} showEdit={activeTab === 'mine'} />
      ) : (
        <div className="gallery-shelf rounded-[2.25rem] px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent/10 text-accent">
            {activeTab === 'mine' ? <ImagePlus size={28} /> : <Heart size={28} />}
          </div>
          <h2 className="mt-5 text-xl font-black">
            {activeTab === 'mine' ? 'まだ投稿がありません' : 'まだいいねがありません'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {activeTab === 'mine'
              ? 'お気に入りのホーム画面やロック画面を投稿すると、ここに自分だけのギャラリーが育っていきます。'
              : '気になるセットアップにハートを付けると、ここからすぐ見返せます。'}
          </p>
          {activeTab === 'mine' && (
            <Link href="/upload" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all">
              <ImagePlus size={16} />
              iPhone画面を投稿する
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
