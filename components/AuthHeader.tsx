import Link from 'next/link'
import { Upload, User, LogIn, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from './ThemeToggle'

export async function AuthHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthed = !!user && !user.is_anonymous

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/apps"
        className="flex items-center justify-center w-9 h-9 rounded-full glass-soft hover:scale-105 active:scale-95 transition-transform"
        aria-label="人気のアプリ"
        title="人気のアプリ"
      >
        <Sparkles size={16} className="text-muted" />
      </Link>
      <ThemeToggle />
      {isAuthed ? (
        <>
          <Link
            href="/me"
            className="flex items-center justify-center w-9 h-9 rounded-full glass-soft hover:scale-105 active:scale-95 transition-transform"
            aria-label="マイページ"
          >
            <User size={16} className="text-muted" />
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            <Upload size={14} />
            投稿
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          <LogIn size={14} />
          ログイン
        </Link>
      )}
    </div>
  )
}
