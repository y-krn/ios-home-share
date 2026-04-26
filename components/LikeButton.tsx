'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { ensureAnonymousUser } from '@/lib/auth'

type Props = { postId: string; initialCount: number }

export function LikeButton({ postId, initialCount }: Props) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    ensureAnonymousUser().then(() => {
      fetch(`/api/likes?postId=${postId}`)
        .then(r => r.json())
        .then(d => setLiked(d.liked))
    })
  }, [postId])

  async function toggle() {
    if (loading) return
    await ensureAnonymousUser()
    setLoading(true)
    const optimisticLiked = !liked
    setLiked(optimisticLiked)
    setCount(c => c + (optimisticLiked ? 1 : -1))
    if (optimisticLiked) {
      setAnimate(true)
      setTimeout(() => setAnimate(false), 400)
    }

    await fetch('/api/likes', {
      method: optimisticLiked ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm transition-colors active:scale-90"
      aria-label="like"
    >
      <Heart
        size={18}
        className={`transition-all ${liked ? 'fill-rose-500 text-rose-500' : 'text-muted'} ${animate ? 'scale-125' : 'scale-100'}`}
      />
      <span className={`text-xs font-medium ${liked ? 'text-rose-500' : 'text-muted'}`}>{count}</span>
    </button>
  )
}
