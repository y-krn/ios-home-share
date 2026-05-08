'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Upload, User, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from './ThemeToggle'

export function AuthHeader() {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (mounted) setIsAuthed(!!user && !user.is_anonymous)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setIsAuthed(!!user && !user.is_anonymous)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/apps"
        prefetch={false}
        className="gallery-caption flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-accent active:scale-90"
        aria-label="人気のアプリ"
        title="人気のアプリ"
      >
        <Sparkles size={16} />
      </Link>
      <ThemeToggle />
      {isAuthed && (
        <Link
          href="/me"
          prefetch={false}
          className="gallery-caption flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-accent active:scale-90"
          aria-label="マイページ"
        >
          <User size={16} />
        </Link>
      )}
      <Link
        href="/upload"
        prefetch={false}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-105 active:scale-95 transition-all"
      >
        <Upload size={14} />
        投稿
      </Link>
      {isAuthed && <SignOutButton />}
    </div>
  )
}
