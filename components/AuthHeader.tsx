'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Upload, User, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from './ThemeToggle'

export function AuthHeader() {
  const [isAuthed, setIsAuthed] = useState(false)
  const pathname = usePathname()
  const isEnglish = pathname?.startsWith('/en')
  const appsHref = isEnglish ? '/en/apps' : '/apps'
  const uploadHref = isEnglish ? '/en/upload' : '/upload'
  const loginHref = isEnglish ? '/en/login' : '/login'
  const myPageHref = isEnglish ? '/en/me' : '/me'
  const appsLabel = isEnglish ? 'Popular apps' : '人気のアプリ'
  const uploadLabel = isEnglish ? 'Share' : '投稿'
  const loginLabel = isEnglish ? 'Log in' : 'ログイン'
  const myPageLabel = isEnglish ? 'My page' : 'マイページ'

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
        href={appsHref}
        prefetch={false}
        className="gallery-caption flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-accent active:scale-90"
        aria-label={appsLabel}
        title={appsLabel}
      >
        <Sparkles size={16} />
      </Link>
      <ThemeToggle />
      <Link
        href={isAuthed ? myPageHref : loginHref}
        prefetch={false}
        className="gallery-caption flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:-translate-y-0.5 hover:text-accent active:scale-90"
        aria-label={isAuthed ? myPageLabel : loginLabel}
        title={isAuthed ? myPageLabel : loginLabel}
      >
        <User size={16} />
      </Link>
      <Link
        href={uploadHref}
        prefetch={false}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-105 active:scale-95 transition-all"
      >
        <Upload size={14} />
        {uploadLabel}
      </Link>
      {isAuthed && <SignOutButton />}
    </div>
  )
}
