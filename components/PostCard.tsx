import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from './LikeButton'
import { DeleteButton } from './DeleteButton'
import { EditButton } from './EditButton'

type ExtractedTags = {
  theme?: string
}

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
    <div className="group glass rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
      <Link href={`/posts/${post.id}`} className="block relative aspect-[9/19.5]">
        <Image
          src={post.image_url}
          alt="iOS home screen"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
          priority={priority}
        />
        {theme && (
          <span className="absolute top-2 right-2 glass-soft text-[10px] font-medium px-2 py-0.5 rounded-full text-white/90">
            {theme}
          </span>
        )}
      </Link>
      <div className="p-2.5 flex items-center justify-between">
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
