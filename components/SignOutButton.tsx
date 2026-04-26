'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()

  async function onClick() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 rounded-full glass-soft hover:scale-105 active:scale-95 hover:text-red-500 text-muted transition-all"
      aria-label="ログアウト"
      title="ログアウト"
    >
      <LogOut size={16} />
    </button>
  )
}
