import Image from 'next/image'
import { ExternalLink, Images, LayoutGrid, Star } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { createAdminClient } from '@/lib/supabase/admin'
import { PostGrid } from '@/components/PostGrid'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { UserAppToggleButton } from '@/components/UserAppToggleButton'
import { UserAvatar } from '@/components/UserAvatar'

type Props = { params: Promise<{ name: string }> }

type ITunesItem = {
  trackId: number
  trackName: string
  artistName: string
  trackViewUrl: string
  artworkUrl512?: string
  artworkUrl100: string
  description?: string
  averageUserRating?: number
  userRatingCount?: number
  genres?: string[]
  formattedPrice?: string
  screenshotUrls?: string[]
  primaryGenreName?: string
}

async function fetchFullInfo(slug: string, country = 'jp'): Promise<ITunesItem | null> {
  // 数値スラッグ → trackId として lookup (正確マッチ)
  if (/^\d+$/.test(slug)) {
    const params = new URLSearchParams({ id: slug, country, entity: 'software' })
    const res = await fetch(`https://itunes.apple.com/lookup?${params}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0] ?? null
  }
  // 文字列 → 名前検索
  const params = new URLSearchParams({ term: slug, country, entity: 'software', limit: '1' })
  const res = await fetch(`https://itunes.apple.com/search?${params}`, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0] ?? null
}

export default async function AppPage({ params }: Props) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const [info, supabase, user] = await Promise.all([
    fetchFullInfo(decodedName),
    Promise.resolve(createAdminClient()),
    getAuthenticatedUser(),
  ])

  // 愛用者情報の取得
  let userAppsCount = 0
  let isUsing = false
  let userIds: string[] = []

  if (info) {
    const trackIdStr = info.trackId.toString()
    
    // 1. 件数カウント
    const { count } = await supabase
      .from('user_apps')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackIdStr)
    userAppsCount = count ?? 0

    // 2. 最新10人のID取得
    const { data: usersData } = await supabase
      .from('user_apps')
      .select('user_id')
      .eq('track_id', trackIdStr)
      .order('created_at', { ascending: false })
      .limit(10)
    userIds = (usersData ?? []).map(d => d.user_id)

    // 3. 自分が愛用中か確認
    if (user) {
      const { data: checkData } = await supabase
        .from('user_apps')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackIdStr)
        .maybeSingle()
      isUsing = !!checkData
    }
  }

  // 数値スラッグ = trackId → app_links/widget_links のURL値で検索 (RPC)
  // 文字列スラッグ = 名前検索フォールバック
  type PostRow = {
    id: string
    image_url: string
    like_count: number
    extracted_tags: Record<string, unknown>
    created_at: string
    anon_user_id: string | null
  }
  let posts: PostRow[] | null = null
  if (/^\d+$/.test(decodedName)) {
    const { data } = await supabase.rpc('posts_by_track_id', { track_id: decodedName })
    posts = (data as PostRow[]) ?? null
  } else {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .or(`extracted_tags->apps.cs.${JSON.stringify([decodedName])},extracted_tags->dock_apps.cs.${JSON.stringify([decodedName])}`)
      .order('created_at', { ascending: false })
      .limit(20)
    posts = data
  }

  return (
    <div className="space-y-6">
      <BackButton variant="text" />

      {info ? (
        <section className="gallery-shelf overflow-hidden rounded-[2.25rem] p-4 sm:p-5 lg:min-h-[420px]">
          <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
            <div className="relative w-28 sm:w-32">
              <div className="absolute -inset-4 rounded-[2rem] bg-accent/10 blur-2xl" />
              <Image
                src={info.artworkUrl512 ?? info.artworkUrl100}
                alt={info.trackName}
                width={128}
                height={128}
                className="relative rounded-[1.75rem] shadow-2xl ring-1 ring-black/5"
                unoptimized
              />
            </div>

            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
                  <LayoutGrid size={13} />
                  App Profile
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black leading-tight">{info.trackName}</h1>
                  <p className="mt-1 truncate text-sm font-semibold text-muted">{info.artistName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {info.primaryGenreName && (
                  <span className="gallery-caption rounded-full px-3 py-1 text-xs font-semibold">{info.primaryGenreName}</span>
                )}
                {info.averageUserRating !== undefined && info.userRatingCount !== undefined && info.userRatingCount > 0 && (
                  <span className="gallery-caption inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {info.averageUserRating.toFixed(1)}
                    <span className="text-muted">({info.userRatingCount.toLocaleString()})</span>
                  </span>
                )}
                {info.formattedPrice && (
                  <span className="gallery-caption rounded-full px-3 py-1 text-xs font-semibold">{info.formattedPrice}</span>
                )}
              </div>

              {info.description && (
                <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted line-clamp-5">
                  {info.description}
                </p>
              )}

              {userAppsCount > 0 && (
                <div className="flex items-center gap-3 rounded-2xl glass-soft p-3 max-w-sm">
                  <div className="flex -space-x-2 overflow-hidden">
                    {userIds.map(uid => (
                      <UserAvatar key={uid} userId={uid} size={28} className="border-2 border-[#090d16]" />
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-muted">
                    {userAppsCount}人がこのアプリを愛用中
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 items-center">
                <a
                  href={info.trackViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition-all hover:bg-accent-strong hover:scale-[1.01] active:scale-95"
                >
                  <ExternalLink size={14} />
                  App Storeで開く
                </a>
                <UserAppToggleButton
                  trackId={info.trackId.toString()}
                  appName={info.trackName}
                  artworkUrl={info.artworkUrl100}
                  initialIsUsing={isUsing}
                  userId={user?.id ?? null}
                />
              </div>
            </div>
          </div>

          {info.screenshotUrls && info.screenshotUrls.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-[0.16em]">
                <Images size={14} />
                App Store Screens
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {info.screenshotUrls.slice(0, 5).map((url, i) => (
                  <Image
                    key={url}
                    src={url}
                    alt={`screenshot ${i + 1}`}
                    width={150}
                    height={325}
                    className="flex-shrink-0 rounded-[1.35rem] shadow-lg ring-1 ring-black/5"
                    unoptimized
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="gallery-caption rounded-[2rem] p-8 text-center">
          <h1 className="text-lg font-black">{decodedName}</h1>
          <p className="mt-2 text-sm text-muted">App Storeで見つかりませんでした</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-[0.16em]">
          <LayoutGrid size={14} />
          {info?.trackName ?? decodedName} を使った投稿
        </h2>
        <PostGrid initialPosts={posts ?? []} tag={decodedName} />
      </div>
    </div>
  )
}
