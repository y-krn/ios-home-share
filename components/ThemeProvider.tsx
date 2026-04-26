'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
  resolved: 'light' | 'dark'
}>({ theme: 'system', setTheme: () => {}, resolved: 'light' })

const KEY = 'theme'

function applyTheme(t: Theme): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  const resolved =
    t === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : t
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  return resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? 'system'
    setThemeState(saved)
    setResolved(applyTheme(saved))

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const cur = (localStorage.getItem(KEY) as Theme | null) ?? 'system'
      if (cur === 'system') setResolved(applyTheme('system'))
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  function setTheme(t: Theme) {
    localStorage.setItem(KEY, t)
    setThemeState(t)
    setResolved(applyTheme(t))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
