import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutGrid, Search, Sparkles, Trophy } from 'lucide-react'
import { extractTrackId } from '@/lib/app-store'
import { getCachedPopularAppsEn } from '@/lib/popular-apps'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Popular iPhone Setup Apps | iSetup',
  description: 'Discover the apps people use in real iPhone home screen and lock screen setups, ranked from shared iSetup screenshots.',
  alternates: {
    canonical: '/en/apps',
    languages: {
      'ja-JP': '/apps',
      en: '/en/apps',
    },
  },
  openGraph: {
    title: 'Popular iPhone setup apps',
    description: 'See which apps appear most often in real iPhone setups shared on iSetup.',
    url: '/en/apps',
    siteName: 'iSetup.app',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Popular iPhone Setup Apps | iSetup',
    description: 'Discover the apps people use in real iPhone home screen and lock screen setups.',
  },
}

export default async function EnglishAppsPage() {
  const apps = await getCachedPopularAppsEn(60)
  const displayApps = apps.map(app => {
    const trackId = app.info ? extractTrackId(app.info.url) : null
    return {
      ...app,
      slug: trackId ?? app.name,
    }
  })
  const totalSetups = displayApps.reduce((sum, app) => sum + app.use_count, 0)
  const featuredApps = displayApps.slice(0, 3)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Popular iPhone setup apps',
    itemListElement: displayApps.slice(0, 30).map((app, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: app.info?.trackName ?? app.name,
      url: `https://isetup.app/en/apps/${encodeURIComponent(app.slug)}`,
    })),
  }

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
            <Trophy size={13} />
            App Index
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">Popular iPhone setup apps</h1>
            <p className="max-w-xl text-sm text-muted leading-relaxed">
              Find real iPhone setups by the apps behind them. Use this index to discover screens you can recreate
              with apps, widgets, and dock choices people actually use.
            </p>
          </div>
        </div>

        <div className="gallery-caption grid grid-cols-2 gap-3 rounded-[2rem] p-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <Search size={13} />
              Apps
            </div>
            <div className="mt-1 text-2xl font-black">{apps.length.toLocaleString('en-US')}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <LayoutGrid size={13} />
              Setup refs
            </div>
            <div className="mt-1 text-2xl font-black">{totalSetups.toLocaleString('en-US')}</div>
          </div>
        </div>
      </section>

      {featuredApps.length > 0 && (
        <section className="gallery-shelf rounded-[2.25rem] p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Most used right now</p>
              <h2 className="mt-1 text-xl font-black">Start with these apps</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {featuredApps.map((app, index) => {
              const display = app.info?.trackName ?? app.name
              return (
                <Link
                  key={app.name}
                  href={`/en/apps/${encodeURIComponent(app.slug)}`}
                  prefetch={false}
                  className="group rounded-[1.75rem] bg-white/35 p-3 transition duration-300 hover:-translate-y-1 active:scale-[0.98] dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    {app.info?.icon ? (
                      <Image
                        src={app.info.icon}
                        alt={display}
                        width={54}
                        height={54}
                        className="rounded-[1.1rem] shadow-lg ring-1 ring-black/5 transition-transform group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[1.1rem] bg-white/30 text-xs text-muted">?</div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-accent">#{index + 1}</div>
                      <div className="truncate text-sm font-black">{display}</div>
                      <div className="mt-0.5 text-xs font-semibold text-muted">
                        {app.use_count.toLocaleString('en-US')} {app.use_count === 1 ? 'setup' : 'setups'}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {apps.length === 0 ? (
        <div className="gallery-caption rounded-[2rem] py-20 text-center text-muted">No app data yet</div>
      ) : (
        <section className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">All app pages</p>
            <h2 className="mt-1 text-xl font-black">Browse setups by app</h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayApps.map((app, i) => {
              const slug = app.slug
              const display = app.info?.trackName ?? app.name
              const featured = i < 3
              return (
                <li key={app.name} className={featured ? 'lg:col-span-1' : ''}>
                  <Link
                    href={`/en/apps/${encodeURIComponent(slug)}`}
                    prefetch={false}
                    className={`group flex h-full items-center gap-3 rounded-[1.75rem] p-3 transition duration-300 hover:-translate-y-1 active:scale-[0.98] ${
                      featured ? 'gallery-shelf' : 'gallery-caption'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {app.info?.icon ? (
                        <Image
                          src={app.info.icon}
                          alt={display}
                          width={featured ? 58 : 50}
                          height={featured ? 58 : 50}
                          className="rounded-[1.05rem] shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[1.05rem] bg-white/30 text-xs text-muted">?</div>
                      )}
                      <span className={`absolute -left-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[11px] font-black shadow-sm ${
                        featured ? 'bg-accent text-white' : 'gallery-caption text-muted'
                      }`}>
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black">{display}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                        <Sparkles size={12} />
                        {app.use_count.toLocaleString('en-US')} {app.use_count === 1 ? 'setup' : 'setups'}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
