'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? 'ライト' : theme === 'dark' ? 'ダーク' : 'システム'

  return (
    <button
      onClick={() => setTheme(next)}
      className="flex items-center justify-center w-9 h-9 rounded-full glass-soft hover:scale-105 active:scale-95 transition-transform"
      title={`テーマ: ${label}`}
      aria-label={`テーマ切替 (現在: ${label})`}
    >
      <Icon size={16} className="text-muted" />
    </button>
  )
}
