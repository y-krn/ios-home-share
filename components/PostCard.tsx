import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from './LikeButton'
import { DeleteButton } from './DeleteButton'
import { EditButton } from './EditButton'

type ExtractedTags = { theme?: string }

type Post = {
  id: string
  image_url: string
  like_count: number
  extracted_tags: ExtractedTags
  created_at: string
  anon_user_id: string | null
}

type Props = { post: Post; priority?: boolean; showEdit?: boolean }

export function PostCard({ post, priority, showEdit }: Props) {
  const tags = post.extracted_tags ?? {}
  const theme = tags.theme

  return (
    <div className="group">
      {/* iPhone frame */}
      <Link href={`/posts/${post.id}`} className="block">
        <div className="relative aspect-[9/19.5] rounded-[2.5rem] overflow-hidden bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] ring-[3px] ring-black ring-offset-1 ring-offset-black/40 transition-transform duration-300 hover:-translate-y-1 active:scale-[0.98]">
          <Image
            src={post.image_url}
            alt="iOS home screen"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={priority ? 'eager' : undefined}
            fetchPriority={priority ? 'high' : undefined}
          />
          {/* Dynamic Island silhouette */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[28%] h-[3.2%] min-h-[18px] bg-black rounded-full pointer-events-none z-10" />
          {theme && (
            <span className="absolute bottom-3 right-3 glass-soft text-white/95 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
              {theme}
            </span>
          )}
        </div>
      </Link>

      {/* メタ情報 (iPhone外) */}
      <div className="px-2 pt-3 flex items-center justify-between">
        <LikeButton postId={post.id} initialCount={post.like_count} />
        {showEdit && (
          <div className="flex items-center gap-2">
            <EditButton postId={post.id} ownerAnonId={post.anon_user_id} />
            <DeleteButton postId={post.id} ownerAnonId={post.anon_user_id} />
          </div>
        )}
      </div>
    </div>
  )
}
