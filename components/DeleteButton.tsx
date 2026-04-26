'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { getCurrentUserId } from '@/lib/auth'

type Props = { postId: string; ownerAnonId: string | null; redirectAfter?: string }

export function DeleteButton({ postId, ownerAnonId, redirectAfter }: Props) {
  const [isOwner, setIsOwner] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!ownerAnonId) return
    getCurrentUserId().then(uid => setIsOwner(uid === ownerAnonId))
  }, [ownerAnonId])

  if (!isOwner) return null

  async function onDelete() {
    if (!confirm('削除しますか？取消不可。')) return
    setDeleting(true)
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('削除失敗')
      setDeleting(false)
      return
    }
    if (redirectAfter) {
      router.push(redirectAfter)
      router.refresh()
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={deleting}
      className="flex items-center justify-center w-8 h-8 rounded-full glass-soft text-muted hover:text-red-500 hover:scale-105 active:scale-90 transition-all disabled:opacity-50"
      aria-label="delete"
      title="削除"
    >
      <Trash2 size={14} />
    </button>
  )
}
