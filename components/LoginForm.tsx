'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Send, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = { nextOverride?: string }

export function LoginForm({ nextOverride }: Props = {}) {
  const searchParams = useSearchParams()
  const next = nextOverride ?? searchParams.get('next') ?? '/me'

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 size={20} />
          <span className="font-semibold">メール送信完了</span>
        </div>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">{email}</span> 宛にログインリンクを送信。受信箱を確認してリンクをタップ。
        </p>
        <p className="text-xs text-muted">
          届かない場合は迷惑メールフォルダを確認。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="メールアドレス"
          className="w-full pl-11 pr-4 h-12 rounded-full glass text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-shadow"
        />
      </div>
      {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
      <button
        type="submit"
        disabled={!email.trim() || sending}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Send size={14} />
        {sending ? '送信中...' : 'ログインリンクを送る'}
      </button>
      <p className="text-[11px] text-muted text-center leading-relaxed">
        ログインすることで <a href="/terms" className="underline hover:text-accent">利用規約</a> と <a href="/privacy" className="underline hover:text-accent">プライバシーポリシー</a> に同意したものとみなされます。
      </p>
    </form>
  )
}
