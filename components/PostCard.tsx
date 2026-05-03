import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from './LikeButton'
import { DeleteButton } from './DeleteButton'
import { EditButton } from './EditButton'

type ExtractedTags = { theme?: string }
type ScreenType = 'home' | 'lock'

type Post = {
  id: string
  image_url: string
  like_count: number
  extracted_tags: ExtractedTags
  created_at: string
  anon_user_id: string | null
}

type Props = { post: Post; priority?: boolean; showEdit?: boolean; featured?: boolean }

export function PostCard({ post, priority, showEdit, featured }: Props) {
  const tags = post.extracted_tags ?? {}
  const theme = tags.theme
  const screenType: ScreenType = (tags as { screen_type?: string; is_lock_screen?: boolean }).screen_type === 'lock' || (tags as { is_lock_screen?: boolean }).is_lock_screen ? 'lock' : 'home'
  const screenLabel = screenType === 'lock' ? 'Lock screen' : 'Home setup'
  const date = new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(post.created_at))

  return (
    <article className={`group ${featured ? 'sm:col-span-2 lg:col-span-3 lg:row-span-2' : 'lg:col-span-2'}`}>
      <Link href={`/posts/${post.id}`} prefetch={false} className="block">
        <div className={`gallery-shelf rounded-[2rem] p-3 sm:p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-34px_rgba(0,0,0,0.65)] active:scale-[0.99] ${featured ? 'lg:p-5' : ''}`}>
          <div className="relative mx-auto max-w-[19rem]">
            <div className="relative rounded-[2rem] bg-[linear-gradient(180deg,rgb(var(--surface)/0.64),rgb(var(--surface)/0.24))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_26px_58px_-38px_rgba(0,0,0,0.58)] ring-1 ring-black/5 dark:ring-white/10">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  {screenLabel}
                </span>
                <span className="h-1.5 w-10 rounded-full bg-black/18 dark:bg-white/18" />
              </div>
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.55rem] bg-black shadow-[0_18px_40px_-30px_rgba(0,0,0,0.7)]">
                <Image
                  src={post.image_url}
                  alt={screenType === 'lock' ? 'iOS lock screen' : 'iOS home screen'}
                  fill
                  className="object-cover"
                  sizes={featured ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px'}
                  loading={priority ? 'eager' : undefined}
                  fetchPriority={priority ? 'high' : undefined}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_28%,transparent_74%,rgba(255,255,255,0.08))]" />
                {theme && (
                  <span className="gallery-caption absolute bottom-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-foreground shadow-lg">
                    {screenType === 'lock' ? `lock / ${theme}` : theme}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-1.5 pt-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LikeButton postId={post.id} initialCount={post.like_count} />
          <span className="text-[11px] font-medium text-muted">{date}</span>
        </div>
        {showEdit && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <EditButton postId={post.id} ownerAnonId={post.anon_user_id} />
            <DeleteButton postId={post.id} ownerAnonId={post.anon_user_id} />
          </div>
        )}
      </div>
    </article>
  )
}
