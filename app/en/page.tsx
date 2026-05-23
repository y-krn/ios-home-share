import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Upload } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { AppIconBackdrop } from '@/components/AppIconBackdrop'
import { PostGrid } from '@/components/PostGrid'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPopularApps } from '@/lib/popular-apps'

export const metadata: Metadata = {
  title: 'iSetup — Real iPhone setups, decoded',
  description: 'Discover real iPhone home screens and lock screens with apps, widgets, colors, and themes automatically detected.',
  alternates: {
    canonical: '/en',
    languages: {
      'ja-JP': '/',
      en: '/en',
    },
  },
  openGraph: {
    title: 'iSetup — Real iPhone setups, decoded',
    description: 'Discover real iPhone home screens and lock screens with apps, widgets, colors, and themes automatically detected.',
    url: '/en',
    siteName: 'iSetup.app',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iSetup — Real iPhone setups, decoded',
    description: 'Discover real iPhone home screens and lock screens with apps, widgets, colors, and themes automatically detected.',
  },
}

export const revalidate = 60

const getCachedPosts = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    return data ?? []
  },
  ['english-home-posts'],
  { revalidate: 60, tags: ['home-posts'] },
)

export default async function EnglishHomePage() {
  const posts = await getCachedPosts()
  const popularApps = await getPopularApps(15)

  return (
    <div className="space-y-8">
      <AppIconBackdrop />

      <section className="space-y-5 pt-2 pb-1">
        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
            Real iPhone setups, decoded
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.03] sm:text-6xl">
            Discover real iPhone setups.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Browse home screens and lock screens from real people, with apps,
            widgets, colors, and themes automatically detected.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/en/upload"
            prefetch={false}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition-all hover:bg-accent-strong hover:scale-[1.01] active:scale-95"
          >
            <Upload size={16} />
            Share your setup
          </Link>
          <a
            href="#latest"
            className="gallery-caption inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:text-accent active:scale-95"
          >
            Browse latest
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section id="latest" className="space-y-4 scroll-mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Latest setups
            </p>
            <h2 className="mt-1 text-2xl font-black">Apps behind every screen</h2>
          </div>
        </div>

        <PostGrid
          initialPosts={posts}
          emptyTitle="No setups yet"
          emptyDescription="Once the first iPhone setup is shared, it will appear here."
          filteredEmptyTitle="No matching setups"
          filteredEmptyDescription="Try another app, widget, or theme."
          loadingLabel="Loading..."
          locale="en"
          popularApps={popularApps}
        />
      </section>
    </div>
  )
}
