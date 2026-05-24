'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Search, Save, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getCurrentUserId } from '@/lib/auth'

export type AppInfo = { url: string; icon: string; trackName: string }
type Candidate = { trackName: string; artistName: string; url: string; icon: string }
type Locale = 'ja' | 'en'

type Props = {
  postId: string
  ownerAnonId: string | null
  imageUrl?: string
  screenType?: 'home' | 'lock'
  initialApps: string[]
  initialDockApps: string[]
  initialWidgets: string[]
  initialTheme: string
  appLinks: Record<string, AppInfo>
  widgetLinks: Record<string, AppInfo>
  locale?: Locale
}

const copy = {
  ja: {
    removeLabel: '削除',
    loadingCandidates: '検索中...',
    noCandidates: '候補なし',
    checkingAuth: '権限を確認しています...',
    unauthorized: '編集権限なし',
    saveFailed: '保存失敗',
    appsLabel: 'アプリ',
    appsPlaceholder: 'アプリ名で検索して追加',
    dockLabel: 'Dock',
    dockPlaceholder: 'Dockアプリを検索して追加',
    widgetsLabel: 'ウィジェット',
    widgetsPlaceholder: 'ウィジェットの提供アプリを検索',
    themeLabel: 'テーマ',
    noTheme: '未指定',
    saving: '保存中...',
    save: '保存',
    savedPath: (postId: string) => `/posts/${postId}`,
  },
  en: {
    removeLabel: 'Remove',
    loadingCandidates: 'Searching...',
    noCandidates: 'No results',
    checkingAuth: 'Checking permission...',
    unauthorized: 'You do not have permission to edit this setup.',
    saveFailed: 'Save failed',
    appsLabel: 'Apps',
    appsPlaceholder: 'Search apps to add',
    dockLabel: 'Dock',
    dockPlaceholder: 'Search Dock apps to add',
    widgetsLabel: 'Widgets',
    widgetsPlaceholder: 'Search widget apps',
    themeLabel: 'Theme',
    noTheme: 'Unspecified',
    saving: 'Saving...',
    save: 'Save',
    savedPath: (postId: string) => `/en/posts/${postId}`,
  },
} satisfies Record<Locale, {
  removeLabel: string
  loadingCandidates: string
  noCandidates: string
  checkingAuth: string
  unauthorized: string
  saveFailed: string
  appsLabel: string
  appsPlaceholder: string
  dockLabel: string
  dockPlaceholder: string
  widgetsLabel: string
  widgetsPlaceholder: string
  themeLabel: string
  noTheme: string
  saving: string
  save: string
  savedPath: (postId: string) => string
}>

export function ListEditor({
  label,
  items,
  setItems,
  placeholder,
  links,
  setLinks,
  locale,
}: {
  label: string
  items: string[]
  setItems: (v: string[]) => void
  placeholder: string
  links: Record<string, AppInfo>
  setLinks: (v: Record<string, AppInfo>) => void
  locale: Locale
}) {
  const t = copy[locale]
  const [input, setInput] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [composing, setComposing] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 入力デバウンス → 候補取得
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!input.trim()) {
      setCandidates([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/app-candidates?name=${encodeURIComponent(input.trim())}`)
        const data: Candidate[] = await res.json()
        setCandidates(data)
      } catch {
        setCandidates([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input])

  // 外クリックでドロップダウン閉じる
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function addCandidate(c: Candidate) {
    if (!items.includes(c.trackName)) {
      setItems([...items, c.trackName])
      setLinks({ ...links, [c.trackName]: { url: c.url, icon: c.icon, trackName: c.trackName } })
    }
    setInput('')
    setCandidates([])
    setShowDropdown(false)
  }

  function remove(i: number) {
    const removed = items[i]
    const next = items.filter((_, idx) => idx !== i)
    setItems(next)
    if (!next.includes(removed)) {
      const newLinks = { ...links }
      delete newLinks[removed]
      setLinks(newLinks)
    }
  }

  return (
    <section className={`gallery-caption rounded-[2rem] p-4 sm:p-5 space-y-3 ${showDropdown && input.trim() ? 'relative z-50' : ''}`}>
      <h2 className="text-xs font-bold text-muted uppercase tracking-[0.16em]">{label}</h2>
      <div className="flex flex-wrap gap-2 min-h-9">
        {items.map((item, i) => {
          const display = links[item]?.trackName ?? item
          return (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2 gallery-caption pl-1 pr-1 py-1 rounded-full text-xs shadow-sm transition-transform hover:-translate-y-0.5"
              title={item}
            >
              {links[item]?.icon ? (
                <Image src={links[item].icon} alt="" width={22} height={22} className="rounded-md shadow-sm" unoptimized />
              ) : (
                <span className="w-[22px] h-[22px] rounded-md bg-white/40 flex items-center justify-center text-[8px] text-muted">?</span>
              )}
              <span className="max-w-[180px] truncate font-semibold text-foreground">{display}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-7 h-7 -my-1 rounded-full hover:bg-danger/10 active:bg-danger/15 flex items-center justify-center text-muted hover:text-danger transition-colors"
                aria-label={t.removeLabel}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </span>
          )
        })}
      </div>
      <div ref={containerRef} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <Input
          value={input}
          onChange={e => { setInput(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={e => {
            // IME変換中のEnterは無視 (e.nativeEvent.isComposing は確実)
            if (e.key === 'Enter') {
              e.preventDefault()
              if (composing || e.nativeEvent.isComposing) return
              // 候補1件のみなら自動選択
              if (candidates.length === 1) addCandidate(candidates[0])
            }
          }}
          placeholder={placeholder}
          className="h-11 text-sm pl-9 rounded-full gallery-caption border-0 bg-transparent"
        />
        {showDropdown && input.trim() && (
          <div className="absolute z-[60] left-0 right-0 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-3xl border border-black/10 bg-[rgb(var(--surface))] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.45)] dark:border-white/10">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted px-4 py-4">
                <Loader2 size={14} className="animate-spin" />
                {t.loadingCandidates}
              </div>
            )}
            {!loading && candidates.length === 0 && (
              <div className="text-xs text-muted px-4 py-6 text-center">{t.noCandidates}</div>
            )}
            {!loading && candidates.length > 0 && (
              <ul className="py-1">
                {candidates.map((c, i) => (
                  <li key={c.url}>
                    <button
                      type="button"
                      onClick={() => addCandidate(c)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-accent/10 active:bg-accent/15 text-left transition-colors"
                    >
                      <Image
                        src={c.icon}
                        alt={c.trackName}
                        width={44}
                        height={44}
                        className="rounded-xl flex-shrink-0 shadow-sm ring-1 ring-black/5"
                        unoptimized
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">{c.trackName}</div>
                        <div className="text-xs text-muted truncate mt-0.5">{c.artistName}</div>
                      </div>
                    </button>
                    {i < candidates.length - 1 && <div className="ml-[68px] border-t border-black/5 dark:border-white/10" />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export function EditTagsForm({
  postId,
  ownerAnonId,
  imageUrl,
  screenType,
  initialApps,
  initialDockApps,
  initialWidgets,
  initialTheme,
  appLinks: initialAppLinks,
  widgetLinks: initialWidgetLinks,
  locale = 'ja',
}: Props) {
  const t = copy[locale]
  const [apps, setApps] = useState(initialApps)
  const [dockApps, setDockApps] = useState(initialDockApps)
  const [widgets, setWidgets] = useState(initialWidgets)
  const [theme, setTheme] = useState(initialTheme)
  const [appLinks, setAppLinks] = useState(initialAppLinks)
  const [widgetLinks, setWidgetLinks] = useState(initialWidgetLinks)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    getCurrentUserId().then(uid => setAuthorized(uid === ownerAnonId))
  }, [ownerAnonId])

  if (authorized === null) {
    return (
      <div className="gallery-caption rounded-[2rem] p-6 text-sm text-muted">
        {t.checkingAuth}
      </div>
    )
  }
  if (!authorized) return <p className="gallery-caption rounded-[2rem] p-5 text-sm font-semibold text-danger">{t.unauthorized}</p>

  async function onSave() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apps,
        dock_apps: dockApps,
        widgets,
        theme,
        app_links: appLinks,
        widget_links: widgetLinks,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? t.saveFailed)
      setSaving(false)
      return
    }
    router.push(t.savedPath(postId))
    router.refresh()
  }

  const isLockScreen = screenType === 'lock'
  const screenLabel = isLockScreen
    ? (locale === 'en' ? 'Lock Screen' : 'Lock screen')
    : (locale === 'en' ? 'Home Screen' : 'Home setup')

  const formContent = (
    <div className="space-y-6">
      {!isLockScreen && (
        <>
          <ListEditor label={t.appsLabel} items={apps} setItems={setApps} placeholder={t.appsPlaceholder} links={appLinks} setLinks={setAppLinks} locale={locale} />
          <ListEditor label={t.dockLabel} items={dockApps} setItems={setDockApps} placeholder={t.dockPlaceholder} links={appLinks} setLinks={setAppLinks} locale={locale} />
        </>
      )}
      <ListEditor label={t.widgetsLabel} items={widgets} setItems={setWidgets} placeholder={t.widgetsPlaceholder} links={widgetLinks} setLinks={setWidgetLinks} locale={locale} />

      <section className="gallery-caption rounded-[2rem] p-4 sm:p-5 space-y-3">
        <h2 className="text-xs font-bold text-muted uppercase tracking-[0.16em]">{t.themeLabel}</h2>
        <div className="flex flex-wrap gap-2">
          {(['dark', 'light', ''] as const).map(themeOption => (
            <button
              key={themeOption || 'none'}
              type="button"
              onClick={() => setTheme(themeOption)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                theme === themeOption ? 'bg-accent text-white shadow-md' : 'gallery-caption text-muted hover:text-foreground'
              }`}
            >
              {themeOption || t.noTheme}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? t.saving : t.save}
      </button>
    </div>
  )

  if (imageUrl) {
    return (
      <div className="grid gap-6 md:grid-cols-[minmax(270px,0.78fr)_minmax(0,1fr)] md:items-start">
        <section className="gallery-shelf rounded-[2.25rem] p-4 sm:p-5 md:sticky md:top-20">
          <div className="relative mx-auto max-w-[15.5rem] sm:max-w-[18rem] lg:max-w-sm">
            <div className="relative rounded-[2.25rem] bg-[linear-gradient(180deg,rgb(var(--surface)/0.64),rgb(var(--surface)/0.24))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_30px_68px_-40px_rgba(0,0,0,0.62)] ring-1 ring-black/5 dark:ring-white/10">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  {screenLabel}
                </span>
                <span className="h-1.5 w-12 rounded-full bg-black/18 dark:bg-white/18" />
              </div>
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-black shadow-[0_20px_44px_-32px_rgba(0,0,0,0.72)]">
                <Image
                  src={imageUrl}
                  alt="post screenshot"
                  fill
                  sizes="(max-width: 1024px) 100vw, 390px"
                  className="object-cover"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_28%,transparent_74%,rgba(255,255,255,0.08))]" />
                {theme && (
                  <span className="gallery-caption absolute bottom-3 right-3 rounded-full px-3 py-1 text-xs font-semibold text-foreground shadow-lg">
                    {theme}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          {formContent}
        </section>
      </div>
    )
  }

  return formContent
}
