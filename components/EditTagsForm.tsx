'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Search, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getCurrentUserId } from '@/lib/auth'

type AppInfo = { url: string; icon: string; trackName: string }
type Candidate = { trackName: string; artistName: string; url: string; icon: string }

type Props = {
  postId: string
  ownerAnonId: string | null
  initialApps: string[]
  initialDockApps: string[]
  initialWidgets: string[]
  initialTheme: string
  appLinks: Record<string, AppInfo>
  widgetLinks: Record<string, AppInfo>
}

function ListEditor({
  label,
  items,
  setItems,
  placeholder,
  links,
  setLinks,
}: {
  label: string
  items: string[]
  setItems: (v: string[]) => void
  placeholder: string
  links: Record<string, AppInfo>
  setLinks: (v: Record<string, AppInfo>) => void
}) {
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
    <div className={`space-y-2 ${showDropdown && input.trim() ? 'relative z-50' : ''}`}>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => {
          const display = links[item]?.trackName ?? item
          return (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 pl-2 pr-1 py-1.5 rounded-full text-xs shadow-sm hover:shadow transition-shadow"
              title={item}
            >
              {links[item]?.icon ? (
                <Image src={links[item].icon} alt="" width={22} height={22} className="rounded-md shadow-sm" unoptimized />
              ) : (
                <span className="w-[22px] h-[22px] rounded-md bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">?</span>
              )}
              <span className="max-w-[180px] truncate font-medium text-gray-800">{display}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-7 h-7 -my-1 rounded-full hover:bg-red-50 active:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </span>
          )
        })}
      </div>
      <div ref={containerRef} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
          className="h-9 text-sm pl-9"
        />
        {showDropdown && input.trim() && (
          <div className="absolute z-[60] left-0 right-0 mt-2 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 max-h-80 overflow-y-auto overscroll-contain">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 px-4 py-4">
                <span className="w-3 h-3 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
                検索中...
              </div>
            )}
            {!loading && candidates.length === 0 && (
              <div className="text-xs text-gray-400 px-4 py-6 text-center">候補なし</div>
            )}
            {!loading && candidates.length > 0 && (
              <ul className="py-1">
                {candidates.map((c, i) => (
                  <li key={c.url}>
                    <button
                      type="button"
                      onClick={() => addCandidate(c)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left transition-colors"
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
                        <div className="text-sm font-medium text-gray-900 truncate">{c.trackName}</div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{c.artistName}</div>
                      </div>
                    </button>
                    {i < candidates.length - 1 && <div className="ml-[68px] border-t border-gray-100" />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function EditTagsForm({
  postId,
  ownerAnonId,
  initialApps,
  initialDockApps,
  initialWidgets,
  initialTheme,
  appLinks: initialAppLinks,
  widgetLinks: initialWidgetLinks,
}: Props) {
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

  if (authorized === null) return null
  if (!authorized) return <p className="text-sm text-red-500">編集権限なし</p>

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
      setError(d.error ?? '保存失敗')
      setSaving(false)
      return
    }
    router.push(`/posts/${postId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <ListEditor label="アプリ" items={apps} setItems={setApps} placeholder="アプリ名で検索して追加" links={appLinks} setLinks={setAppLinks} />
      <ListEditor label="Dock" items={dockApps} setItems={setDockApps} placeholder="Dockアプリを検索して追加" links={appLinks} setLinks={setAppLinks} />
      <ListEditor label="ウィジェット" items={widgets} setItems={setWidgets} placeholder="ウィジェットの提供アプリを検索" links={widgetLinks} setLinks={setWidgetLinks} />

      <div className="space-y-2">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">テーマ</h2>
        <div className="flex gap-2">
          {(['dark', 'light', ''] as const).map(t => (
            <button
              key={t || 'none'}
              type="button"
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                theme === t ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t || '未指定'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Save size={16} />
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}
