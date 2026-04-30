'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PostCard } from './PostCard'

type Post = {
  id: string
  image_url: string
  like_count: number
  extracted_tags: Record<string, unknown>
  created_at: string
  anon_user_id: string | null
}

type Props = { initialPosts: Post[]; tag?: string; theme?: string; showEdit?: boolean }

export function PostGrid({ initialPosts, tag, theme, showEdit }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(
    initialPosts.at(-1)?.created_at ?? null
  )
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return
    setLoading(true)
    const params = new URLSearchParams({ cursor })
    if (tag) params.set('tag', tag)
    if (theme) params.set('theme', theme)
    const res = await fetch(`/api/posts?${params}`)
    const data: Post[] = await res.json()
    setPosts(p => [...p, ...data])
    setCursor(data.at(-1)?.created_at ?? null)
    setHasMore(data.length === 20)
    setLoading(false)
  }, [loading, hasMore, cursor, tag, theme])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore])

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>まだ投稿がありません</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 max-w-md sm:max-w-none mx-auto">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} priority={i < 3} showEdit={showEdit} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">読み込み中...</div>
      )}
    </>
  )
}
