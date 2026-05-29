import type { Metadata } from 'next'
import Image from 'next/image'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { CalendarDays, CheckCircle2, LayoutGrid, Palette, PanelBottom, Smartphone, WandSparkles } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { createAdminClient } from '@/lib/supabase/admin'
import { LikeButton } from '@/components/LikeButton'
import { TagBadge } from '@/components/TagBadge'
import { AppLink } from '@/components/AppLink'
import { ShareButton } from '@/components/ShareButton'
import { RecreateChecklist } from '@/components/RecreateChecklist'
import { getAuthenticatedUser } from '@/lib/auth-server'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ posted?: string }>
}

type Locale = 'ja' | 'en'

const getPost = cache(async (id: string) => {
  const supabase = createAdminClient()
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()
  return post
})

export async function generatePostMetadata(id: string, locale: Locale = 'ja'): Promise<Metadata> {
  const post = await getPost(id)

  if (!post) {
    return {
      title: locale === 'en' ? 'Post not found | iSetup' : '投稿が見つかりません | iSetup',
    }
  }

  const tags = post.extracted_tags ?? {}
  const isLockScreen = tags.screen_type === 'lock' || tags.is_lock_screen
  const title = locale === 'en'
    ? isLockScreen ? 'iPhone Lock Screen Setup | iSetup' : 'iPhone Home Screen Setup | iSetup'
    : isLockScreen ? 'iPhoneロック画面のセットアップ | iSetup' : 'iPhoneホーム画面のセットアップ | iSetup'
  const description = locale === 'en'
    ? isLockScreen
      ? 'A real iPhone lock screen setup shared on iSetup, with widgets, colors, and theme detected.'
      : 'A real iPhone home screen setup shared on iSetup, with apps, widgets, colors, and theme detected.'
    : isLockScreen
      ? 'iSetupで共有されたiPhoneロック画面のスクリーンショットです。'
      : 'iSetupで共有されたiPhoneホーム画面のスクリーンショットです。'
  const canonical = locale === 'en' ? `/en/posts/${post.id}` : `/posts/${post.id}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'ja-JP': `/posts/${post.id}`,
        en: `/en/posts/${post.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'iSetup.app',
      locale: locale === 'en' ? 'en_US' : 'ja_JP',
      type: 'article',
      images: [
        {
          url: post.image_url,
          alt: isLockScreen ? 'iPhone lock screen screenshot' : 'iPhone home screen screenshot',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.image_url],
    },
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return generatePostMetadata(id)
}

export default async function PostPage({ params, searchParams }: Props) {
  const { id } = await params
  const { posted } = await searchParams
  return <PostDetail id={id} posted={posted} locale="ja" />
}

export async function PostDetail({ id, posted, locale = 'ja' }: { id: string; posted?: string; locale?: Locale }) {
  const post = await getPost(id)
  if (!post) notFound()

  const user = await getAuthenticatedUser()
  let initialLiked = false
  if (user) {
    const supabase = createAdminClient()
    const { data: likeData } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('anon_user_id', user.id)
      .maybeSingle()
    initialLiked = !!likeData
  }

  const isEnglish = locale === 'en'
  const tags = post.extracted_tags ?? {}
  const apps: string[] = tags.apps ?? []
  const widgets: string[] = tags.widgets ?? []
  const dockApps: string[] = tags.dock_apps ?? []
  const colors: string[] = tags.wallpaper_colors ?? []
  const theme: string = tags.theme ?? ''
  const screenType = tags.screen_type === 'lock' || tags.is_lock_screen ? 'lock' : 'home'
  const isLockScreen = screenType === 'lock'
  const screenLabel = isLockScreen ? (isEnglish ? 'Lock Screen' : 'Lock screen') : (isEnglish ? 'Home Screen' : 'Home setup')
  const appLinks: Record<string, { url: string; icon: string; trackName: string }> = tags.app_links ?? {}
  const widgetLinks: Record<string, { url: string; icon: string; trackName: string }> = tags.widget_links ?? {}
  const createdAt = new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(post.created_at))
  const appCount = apps.length + dockApps.length
  const themePrefix = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : ''
  const titleText = isEnglish
    ? `${themePrefix ? `${themePrefix} ` : ''}iPhone ${isLockScreen ? 'lock screen setup' : 'home screen setup'}`
    : `${themePrefix || 'iOS'} ${isLockScreen ? 'lock screen' : 'home setup'}`
  const shareTitle = isEnglish
    ? isLockScreen ? 'iPhone Lock Screen Setup | iSetup' : 'iPhone Home Screen Setup | iSetup'
    : `iSetup: ${screenLabel}`
  const shareText = isEnglish
    ? isLockScreen
      ? 'I shared my iPhone lock screen on iSetup.\n\nWidgets, colors, and theme are automatically detected.'
      : 'I shared my iPhone setup on iSetup.\n\nApps, widgets, colors, and theme are automatically detected.'
    : `iSetupで${isLockScreen ? 'ロック画面' : 'ホーム画面'}のセットアップを見てみる`
  const profileLabel = isLockScreen ? 'Lock Screen Profile' : 'Setup Profile'
  const successTitle = isEnglish ? 'Your setup is live' : '投稿が完了しました'
  const successDescription = isEnglish
    ? isLockScreen
      ? 'Your widgets, colors, and theme were detected and added to this lock screen profile.'
      : 'Your apps, widgets, colors, and theme were detected and added to this setup profile.'
    : 'AIが読み取ったアプリやウィジェットは、このページから確認できます。'

  return (
    <div className="space-y-6">
      <BackButton fallback={isEnglish ? '/en' : '/'} variant="text" label={isEnglish ? 'Back' : undefined} />

      {posted === '1' && (
        <div className="gallery-caption flex items-start gap-3 rounded-3xl p-4 text-accent">
          <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-black">{successTitle}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {successDescription}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(270px,0.78fr)_minmax(0,1fr)] md:items-start">
        <section className="gallery-shelf order-2 rounded-[2.25rem] p-4 sm:p-5 md:order-none md:sticky md:top-20">
          <div className="relative mx-auto max-w-[15.5rem] sm:max-w-[18rem] lg:max-w-sm">
            <div className="relative rounded-[2.25rem] bg-[linear-gradient(180deg,rgb(var(--surface)/0.64),rgb(var(--surface)/0.24))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_30px_68px_-40px_rgba(0,0,0,0.62)] ring-1 ring-black/5 dark:ring-white/10">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  {screenLabel}
                </span>
                <span className="h-1.5 w-12 rounded-full bg-black/18 dark:bg-white/18" />
              </div>
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-black shadow-[0_20px_44px_-32px_rgba(0,0,0,0.72)]">
                <Image
                  src={post.image_url}
                  alt={isLockScreen ? 'iOS lock screen' : 'iOS home screen'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 390px"
                  className="object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_28%,transparent_74%,rgba(255,255,255,0.08))]" />
                {theme && (
                  <span className="gallery-caption absolute bottom-3 right-3 rounded-full px-3 py-1 text-xs font-semibold text-foreground shadow-lg">
                    {theme}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 space-y-5 md:order-none">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
              <Smartphone size={13} />
              {profileLabel}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-black leading-tight">
                {titleText}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {createdAt}
                </span>
                <LikeButton postId={post.id} initialCount={post.like_count} initialLiked={initialLiked} locale={locale} />
                <ShareButton title={shareTitle} text={shareText} locale={locale} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="gallery-caption rounded-2xl p-3">
              <div className="text-xl sm:text-2xl font-black">{appCount}</div>
              <div className="text-[11px] font-semibold text-muted">Apps</div>
            </div>
            <div className="gallery-caption rounded-2xl p-3">
              <div className="text-xl sm:text-2xl font-black">{widgets.length}</div>
              <div className="text-[11px] font-semibold text-muted">Widgets</div>
            </div>
            <div className="gallery-caption rounded-2xl p-3">
              <div className="text-xl sm:text-2xl font-black">{colors.length}</div>
              <div className="text-[11px] font-semibold text-muted">Colors</div>
            </div>
          </div>

          <RecreateChecklist postId={post.id} extractedTags={tags} locale={locale} />

          {colors.length > 0 && (
            <div className="gallery-caption rounded-3xl p-4 space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-[0.16em]">
                <Palette size={14} />
                {isEnglish ? 'Wallpaper Colors' : 'Wallpaper Palette'}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {colors.map(c => (
                  <div key={c} className="space-y-2">
                    <div className="h-16 rounded-2xl border border-black/10 shadow-inner" style={{ backgroundColor: c }} />
                    <div className="text-[10px] font-semibold text-muted">{c}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {apps.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-[0.16em]">
                <LayoutGrid size={14} />
                {isEnglish ? 'Apps behind this setup' : 'Home Screen Apps'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {apps.map(app => <AppLink key={app} name={app} info={appLinks[app]} locale={locale} />)}
              </div>
            </div>
          )}

          {dockApps.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-[0.16em]">
                <PanelBottom size={14} />
                Dock
              </h2>
              <div className="gallery-caption rounded-3xl p-3">
                <div className="flex flex-wrap gap-2">
                  {dockApps.map(app => <AppLink key={app} name={app} info={appLinks[app]} locale={locale} />)}
                </div>
              </div>
            </div>
          )}

          {widgets.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-[0.16em]">
                <WandSparkles size={14} />
                Widgets
              </h2>
              <div className="flex flex-wrap gap-2">
                {widgets.map(w => <TagBadge key={w} tag={w} type="widget" label={widgetLinks[w]?.trackName} locale={locale} />)}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
