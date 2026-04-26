'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { getCurrentUserId } from '@/lib/auth'

type Props = { postId: string; ownerAnonId: string | null }

export function EditButton({ postId, ownerAnonId }: Props) {
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (!ownerAnonId) return
    getCurrentUserId().then(uid => setIsOwner(uid === ownerAnonId))
  }, [ownerAnonId])

  if (!isOwner) return null

  return (
    <Link
      href={`/posts/${postId}/edit`}
      className="flex items-center justify-center w-8 h-8 rounded-full glass-soft text-muted hover:text-indigo-500 hover:scale-105 active:scale-90 transition-all"
      title="編集"
    >
      <Pencil size={13} />
    </Link>
  )
}
