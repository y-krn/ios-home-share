import type { Metadata } from 'next'
import Image from 'next/image'
import { ExternalLink, Images, LayoutGrid, Search, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { PostGrid } from '@/components/PostGrid'
import { lookupFullApp } from '@/lib/app-store'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { UserAppToggleButton } from '@/components/UserAppToggleButton'
import { UserAvatar } from '@/components/UserAvatar'
import { unstable_cache } from 'next/cache'

type Props = { params: Promise<{ name: string }> }

type PostRow = {
  id: string
  image_url: string
  like_count: number
  extracted_tags: Record<string, unknown>
  created_at: string
  anon_user_id: string | null
}



async function lookupEnglishApp(slug: string) {
  return (await lookupFullApp(slug, 'us')) ?? (await lookupFullApp(slug, 'jp'))
}

const getCachedEnglishApp = unstable_cache(
  async (slug: string) => lookupEnglishApp(slug),
  ['english-app-lookup'],
  { revalidate: 86400 }
)

async function getPostsForApp(slug: string, limit = 20): Promise<PostRow[]> {
  const supabase = createAdminClient()

  if (/^\d+$/.test(slug)) {
    const { data } = await supabase.rpc('posts_by_track_id', { track_id: slug })
    return ((data as PostRow[]) ?? []).slice(0, limit)
  }

  const { data } = await supabase
    .from('posts')
    .select('*')
    .or(`extracted_tags->apps.cs.${JSON.stringify([slug])},extracted_tags->dock_apps.cs.${JSON.stringify([slug])}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const [info, posts] = await Promise.all([
    getCachedEnglishApp(decodedName),
    getPostsForApp(decodedName, 1),
  ])
  const appName = info?.trackName ?? decodedName
  const canonical = `/en/apps/${encodeURIComponent(name)}`
  const hasDiscoveryContent = !!info || posts.length > 0

  return {
    title: `iPhone setups using ${appName} | iSetup`,
    description: `Browse real iPhone home screen and lock screen setups featuring ${appName}, with apps, widgets, colors, and themes automatically detected.`,
    robots: hasDiscoveryContent ? undefined : { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        'ja-JP': `/apps/${encodeURIComponent(name)}`,
        en: canonical,
      },
    },
    openGraph: {
      title: `iPhone setups using ${appName} | iSetup`,
      description: `Browse real iPhone setups featuring ${appName}, with apps, widgets, colors, and themes automatically detected.`,
      url: canonical,
      siteName: 'iSetup.app',
      locale: 'en_US',
      type: 'website',
      images: info?.artworkUrl512 || info?.artworkUrl100
        ? [{ url: info.artworkUrl512 ?? info.artworkUrl100, alt: `${appName} app icon` }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `iPhone setups using ${appName} | iSetup`,
      description: `Browse real iPhone setups featuring ${appName}.`,
      images: info?.artworkUrl512 || info?.artworkUrl100 ? [info.artworkUrl512 ?? info.artworkUrl100] : undefined,
    },
  }
}

export default async function EnglishAppPage({ params }: Props) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const [info, supabase, user] = await Promise.all([
    getCachedEnglishApp(decodedName),
    Promise.resolve(createAdminClient()),
    getAuthenticatedUser(),
  ])

  // 愛用者情報の取得
  let userAppsCount = 0
  let isUsing = false
  let userIds: string[] = []
  let posts: PostRow[] = []

  if (info) {
    const trackIdStr = info.trackId.toString()

    // データベースへの件数カウント、アバターリスト取得、自分の愛用チェック、投稿リスト取得を一括並列実行
    const [countRes, usersRes, checkRes, postsRes] = await Promise.all([
      // 1. 件数カウント
      supabase
        .from('user_apps')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', trackIdStr),
      // 2. 最新10人のID取得
      supabase
        .from('user_apps')
        .select('user_id')
        .eq('track_id', trackIdStr)
        .order('created_at', { ascending: false })
        .limit(10),
      // 3. 自分が愛用中か確認
      user
        ? supabase
            .from('user_apps')
            .select('id')
            .eq('user_id', user.id)
            .eq('track_id', trackIdStr)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // 4. 投稿一覧の取得
      getPostsForApp(decodedName)
    ])

    userAppsCount = countRes.count ?? 0
    userIds = (usersRes.data ?? []).map(d => d.user_id)
    isUsing = !!checkRes.data
    posts = postsRes
  } else {
    // アプリ情報が取れなくても、投稿一覧のフォールバック取得
    posts = await getPostsForApp(decodedName)
  }

  const appName = info?.trackName ?? decodedName
  const setupCount = posts.length
  const trackId = /^\d+$/.test(decodedName) ? decodedName : undefined
  const canonicalUrl = `https://isetup.app/en/apps/${encodeURIComponent(name)}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `iPhone setups using ${appName}`,
        description: `Real iPhone home screen and lock screen setups featuring ${appName}.`,
        url: canonicalUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: 'iSetup.app',
          url: 'https://isetup.app',
        },
      },
      info && {
        '@type': 'SoftwareApplication',
        name: info.trackName,
        applicationCategory: info.primaryGenreName,
        operatingSystem: 'iOS',
        url: info.trackViewUrl,
        image: info.artworkUrl512 ?? info.artworkUrl100,
        author: {
          '@type': 'Organization',
          name: info.artistName,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Popular apps',
            item: 'https://isetup.app/en/apps',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: appName,
            item: canonicalUrl,
          },
        ],
      },
    ].filter(Boolean),
  }

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BackButton fallback="/en/apps" variant="text" label="Back" />

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
                  Setup Discovery
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black leading-tight">iPhone setups using {info.trackName}</h1>
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
                    <span className="text-muted">({info.userRatingCount.toLocaleString('en-US')})</span>
                  </span>
                )}
                {info.formattedPrice && (
                  <span className="gallery-caption rounded-full px-3 py-1 text-xs font-semibold">{info.formattedPrice}</span>
                )}
                <span className="gallery-caption inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                  <Sparkles size={12} />
                  {setupCount.toLocaleString('en-US')} {setupCount === 1 ? 'setup' : 'setups'}
                </span>
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-muted">
                See real iPhone home screens and lock screens where {info.trackName} appears,
                with apps, widgets, colors, and themes detected from shared setups.
              </p>

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
                    {userAppsCount} {userAppsCount === 1 ? 'person is' : 'people are'} using this app
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
                  Open in App Store
                </a>
                <UserAppToggleButton
                  trackId={info.trackId.toString()}
                  appName={info.trackName}
                  artworkUrl={info.artworkUrl100}
                  initialIsUsing={isUsing}
                  userId={user?.id ?? null}
                  locale="en"
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
                    alt={`App Store screenshot ${i + 1}`}
                    width={180}
                    height={320}
                    className="flex-shrink-0 rounded-[1.35rem] shadow-lg ring-1 ring-black/5"
                    unoptimized
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="gallery-caption rounded-[2rem] p-8">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-2xl font-black">iPhone setups using {decodedName}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              We could not find this app in the US App Store, but you can still browse setup posts that mention it.
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <LayoutGrid size={13} />
            Matching setups
          </div>
          <div className="mt-1 text-2xl font-black">{setupCount.toLocaleString('en-US')}</div>
        </div>
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <Search size={13} />
            What to inspect
          </div>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">
            Dock placement, widgets, color palette, and related apps.
          </p>
        </div>
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <ShieldCheck size={13} />
            Independent
          </div>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">
            App names and icons belong to their respective owners.
          </p>
        </div>
      </section>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Setup gallery</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
            <LayoutGrid size={18} />
            iPhone setups using {appName}
          </h2>
        </div>
        <PostGrid
          initialPosts={posts}
          tag={decodedName}
          trackId={trackId}
          emptyTitle="No setups yet"
          emptyDescription={`No shared setups using ${appName} yet.`}
          filteredEmptyTitle="No matching setups"
          filteredEmptyDescription="Try another app, widget, or theme."
          loadingLabel="Loading..."
          locale="en"
        />
      </div>
    </div>
  )
}
