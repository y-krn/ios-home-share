import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackButton } from '@/components/BackButton'
import { createAdminClient } from '@/lib/supabase/admin'
import { LikeButton } from '@/components/LikeButton'
import { TagBadge } from '@/components/TagBadge'
import { AppLink } from '@/components/AppLink'

type Props = { params: Promise<{ id: string }> }

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()
  if (!post) notFound()

  const tags = post.extracted_tags ?? {}
  const apps: string[] = tags.apps ?? []
  const widgets: string[] = tags.widgets ?? []
  const dockApps: string[] = tags.dock_apps ?? []
  const colors: string[] = tags.wallpaper_colors ?? []
  const theme: string = tags.theme ?? ''
  const appLinks: Record<string, { url: string; icon: string; trackName: string }> = tags.app_links ?? {}
  const widgetLinks: Record<string, { url: string; icon: string; trackName: string }> = tags.widget_links ?? {}

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <BackButton fallback="/" variant="text" />

      <div className="relative aspect-[9/19.5] rounded-[2.5rem] overflow-hidden bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] ring-[3px] ring-black ring-offset-1 ring-offset-black/40">
        <Image src={post.image_url} alt="iOS home screen" fill sizes="(max-width: 640px) 100vw, 384px" className="object-cover" loading="eager" fetchPriority="high" />
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[28%] h-[3.2%] min-h-[18px] bg-black rounded-full pointer-events-none z-10" />
        {theme && (
          <span className="absolute bottom-3 right-3 glass-soft text-white/95 text-xs font-medium px-3 py-1 rounded-full">
            {theme}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LikeButton postId={post.id} initialCount={post.like_count} />
        </div>
        {colors.length > 0 && (
          <div className="flex gap-1">
            {colors.map(c => (
              <div key={c} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        )}
      </div>

      {apps.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">アプリ</h2>
          <div className="flex flex-wrap gap-1.5">
            {apps.map(app => <AppLink key={app} name={app} info={appLinks[app]} />)}
          </div>
        </div>
      )}

      {dockApps.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Dock</h2>
          <div className="flex flex-wrap gap-1.5">
            {dockApps.map(app => <AppLink key={app} name={app} info={appLinks[app]} />)}
          </div>
        </div>
      )}

      {widgets.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">ウィジェット</h2>
          <div className="flex flex-wrap gap-1.5">
            {widgets.map(w => <TagBadge key={w} tag={w} type="widget" label={widgetLinks[w]?.trackName} />)}
          </div>
        </div>
      )}
    </div>
  )
}
