'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Loader2 } from 'lucide-react'

type Props = {
  trackId: string
  appName: string
  artworkUrl: string
  initialIsUsing: boolean
  userId: string | null
  locale?: 'ja' | 'en'
}

export function UserAppToggleButton({
  trackId,
  appName,
  artworkUrl,
  initialIsUsing,
  userId,
  locale = 'ja',
}: Props) {
  const router = useRouter()
  const [isUsing, setIsUsing] = useState(initialIsUsing)
  const [loading, setLoading] = useState(false)

  const isEnglish = locale === 'en'

  const labelAdd = isEnglish ? 'Add to My Apps' : '愛用アプリに追加'
  const labelUsing = isEnglish ? 'Using' : '愛用中'

  async function handleToggle() {
    // 1. Redirect if unauthenticated
    if (!userId) {
      const nextPath = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(isEnglish ? `/en/login?next=${nextPath}` : `/login?next=${nextPath}`)
      return
    }

    if (loading) return
    setLoading(true)

    // 2. Optimistic Update
    const nextState = !isUsing
    setIsUsing(nextState)

    try {
      const method = nextState ? 'POST' : 'DELETE'
      const url = nextState
        ? '/api/user-apps'
        : `/api/user-apps?trackId=${encodeURIComponent(trackId)}`

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: nextState
          ? JSON.stringify({
              trackId,
              appName,
              artworkUrl,
            })
          : undefined,
      })

      if (!res.ok) {
        throw new Error('API Request Failed')
      }

      // 3. Refresh Server Component data to update avatar list & counts
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle user app affinity:', error)
      // Rollback optimistic update
      setIsUsing(!nextState)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all shadow-lg active:scale-95 disabled:opacity-80 ${
        isUsing
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/10'
          : 'bg-white/10 hover:bg-white/15 text-foreground ring-1 ring-white/10 shadow-black/10'
      }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isUsing ? (
        <Check size={14} />
      ) : (
        <Plus size={14} />
      )}
      <span>{isUsing ? labelUsing : labelAdd}</span>
    </button>
  )
}
