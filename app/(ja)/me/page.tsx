import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Grid2X2, Heart, ImagePlus, UserRound, Smartphone } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { PostGrid } from '@/components/PostGrid'

export const revalidate = 0
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

type Props = {
  searchParams: Promise<{ tab?: string }>
}

type Locale = 'ja' | 'en'

const copy = {
  ja: {
    loginPath: '/login?next=/me',
    pageHref: '/me',
    likedHref: '/me?tab=liked',
    appsHref: '/me?tab=apps',
    uploadHref: '/upload',
    eyebrow: 'My Gallery',
    title: 'マイページ',
    description: '自分の投稿と、あとで見返したいiPhone画面をまとめて確認できます。',
    mineTab: '自分の投稿',
    likedTab: 'いいね',
    appsTab: '愛用アプリ',
    emptyMineTitle: 'まだ投稿がありません',
    emptyLikedTitle: 'まだいいねがありません',
    emptyAppsTitle: '愛用アプリが登録されていません',
    emptyMineDescription: 'お気に入りのホーム画面やロック画面を投稿すると、ここに自分だけのギャラリーが育っていきます。',
    emptyLikedDescription: '気になるセットアップにハートを付けると、ここからすぐ見返せます。',
    emptyAppsDescription: 'アプリ詳細ページで「愛用アプリに追加」を押すと、ここにあなたのお気に入りアプリが並びます。',
    uploadLabel: 'iPhone画面を投稿する',
    findAppsLabel: 'アプリを探す',
    gridEmptyTitle: 'まだ投稿がありません',
    gridEmptyDescription: '最初のiPhone画面が投稿されると、ここにギャラリーとして並びます。',
    filteredEmptyTitle: '条件に合う投稿がありません',
    filteredEmptyDescription: '別のアプリ、ウィジェット、テーマで探してみてください。',
    loadingLabel: '読み込み中...',
  },
  en: {
    loginPath: '/en/login?next=/en/me',
    pageHref: '/en/me',
    likedHref: '/en/me?tab=liked',
    appsHref: '/en/me?tab=apps',
    uploadHref: '/en/upload',
    eyebrow: 'My Gallery',
    title: 'My page',
    description: 'Review your shared iPhone setups and the screens you liked.',
    mineTab: 'My posts',
    likedTab: 'Liked',
    appsTab: 'My Apps',
    emptyMineTitle: 'No posts yet',
    emptyLikedTitle: 'No likes yet',
    emptyAppsTitle: 'No apps added yet',
    emptyMineDescription: 'Share your favorite home screen or lock screen to start building your personal gallery.',
    emptyLikedDescription: 'Tap the heart on setups you want to revisit, and they will appear here.',
    emptyAppsDescription: 'Add apps from their profile pages, and your favorite apps will appear here.',
    uploadLabel: 'Share an iPhone setup',
    findAppsLabel: 'Find Apps',
    gridEmptyTitle: 'No posts yet',
    gridEmptyDescription: 'Your shared iPhone setups will appear here.',
    filteredEmptyTitle: 'No matching setups',
    filteredEmptyDescription: 'Try another app, widget, or theme.',
    loadingLabel: 'Loading...',
  },
} satisfies Record<Locale, Record<string, string>>

export default async function MyPage({ searchParams }: Props) {
  return <MyPageContent searchParams={searchParams} locale="ja" />
}

export async function MyPageContent({ searchParams, locale }: Props & { locale: Locale }) {
  const { tab } = await searchParams
  const activeTab = tab === 'liked' ? 'liked' : tab === 'apps' ? 'apps' : 'mine'
  const t = copy[locale]

  const user = await getAuthenticatedUser()
  if (!user) redirect(t.loginPath)

  const admin = createAdminClient()

  let posts: unknown[] = []
  type UserAppRow = {
    id: string
    track_id: string
    app_name: string
    artwork_url: string
    created_at: string
  }
  let userApps: UserAppRow[] = []

  if (activeTab === 'mine') {
    const { data } = await admin
      .from('posts')
      .select('*')
      .eq('anon_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    posts = data ?? []
  } else if (activeTab === 'liked') {
    // いいねした投稿: likes JOIN posts
    const { data } = await admin
      .from('likes')
      .select('post_id, created_at, posts(*)')
      .eq('anon_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    posts = (data ?? []).map((l: { posts: unknown }) => l.posts).filter(Boolean)
  } else {
    // 愛用アプリ一覧
    const { data } = await admin
      .from('user_apps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    userApps = (data as UserAppRow[]) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
          <UserRound size={13} />
          {t.eyebrow}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">{t.title}</h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed">
            {t.description}
          </p>
        </div>
      </div>

      <div className="gallery-caption rounded-full p-1 inline-flex">
        <Link
          href={t.pageHref}
          className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'mine'
              ? 'bg-accent text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Grid2X2 size={14} />
          {t.mineTab}
        </Link>
        <Link
          href={t.likedHref}
          className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'liked'
              ? 'bg-accent text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Heart size={14} />
          {t.likedTab}
        </Link>
        <Link
          href={t.appsHref}
          className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'apps'
              ? 'bg-accent text-white shadow-md'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Smartphone size={14} />
          {t.appsTab}
        </Link>
      </div>

      {activeTab === 'apps' ? (
        userApps.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {userApps.map(app => (
              <Link
                key={app.track_id}
                href={locale === 'en' ? `/en/apps/${app.track_id}` : `/apps/${app.track_id}`}
                className="gallery-shelf rounded-[1.75rem] p-4 flex flex-col items-center text-center space-y-3 hover:-translate-y-1 transition-all group"
              >
                <div className="relative w-20 h-20 shadow-md rounded-2xl overflow-hidden group-hover:scale-105 transition-all">
                  <Image
                    src={app.artwork_url}
                    alt={app.app_name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-xs font-bold text-foreground line-clamp-2 max-w-full">
                  {app.app_name}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="gallery-shelf rounded-[2.25rem] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent/10 text-accent">
              <Smartphone size={28} />
            </div>
            <h2 className="mt-5 text-xl font-black">{t.emptyAppsTitle}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              {t.emptyAppsDescription}
            </p>
            <Link href={locale === 'en' ? '/en/apps' : '/apps'} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all">
              <Smartphone size={16} />
              {t.findAppsLabel}
            </Link>
          </div>
        )
      ) : posts.length > 0 ? (
        <PostGrid
          initialPosts={posts as never}
          showEdit={activeTab === 'mine'}
          emptyTitle={t.gridEmptyTitle}
          emptyDescription={t.gridEmptyDescription}
          filteredEmptyTitle={t.filteredEmptyTitle}
          filteredEmptyDescription={t.filteredEmptyDescription}
          loadingLabel={t.loadingLabel}
          locale={locale}
        />
      ) : (
        <div className="gallery-shelf rounded-[2.25rem] px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent/10 text-accent">
            {activeTab === 'mine' ? <ImagePlus size={28} /> : <Heart size={28} />}
          </div>
          <h2 className="mt-5 text-xl font-black">
            {activeTab === 'mine' ? t.emptyMineTitle : t.emptyLikedTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {activeTab === 'mine'
              ? t.emptyMineDescription
              : t.emptyLikedDescription}
          </p>
          {activeTab === 'mine' && (
            <Link href={t.uploadHref} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all">
              <ImagePlus size={16} />
              {t.uploadLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
