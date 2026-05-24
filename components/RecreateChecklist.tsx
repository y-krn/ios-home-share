'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Check, CheckCircle2, ChevronDown, ChevronUp, Download, Smartphone } from 'lucide-react'
import type { ExtractedTags } from '@/lib/gemini'

type ChecklistItem = {
  id: string
  type: 'app' | 'widget' | 'theme' | 'wallpaper'
  label: string
  status: 'todo' | 'done'
  linkUrl?: string
  iconUrl?: string
}

type SetupChecklistState = {
  postId: string
  items: ChecklistItem[]
}

type Props = {
  postId: string
  extractedTags: ExtractedTags
  locale?: 'ja' | 'en'
}

const copy = {
  ja: {
    title: 'このセットアップを再現する',
    description: 'チェックリストに沿ってアプリの導入や設定を進めましょう。',
    progressLabel: '進捗状況',
    doneLabel: '再現完了！素晴らしいセットアップです！',
    appLabel: (name: string) => `${name} をインストール`,
    widgetLabel: (name: string) => `${name} ウィジェットを追加`,
    themeLabel: (theme: string) => `テーマを「${theme === 'dark' ? 'ダーク' : 'ライト'}」に設定`,
    colorLabel: (colors: string[]) => `壁紙カラー（${colors.join(', ')}）をベースに壁紙を設定`,
    installBtn: '入手',
  },
  en: {
    title: 'Recreate this Setup',
    description: 'Follow the checklist steps to set up this screen on your device.',
    progressLabel: 'Progress',
    doneLabel: 'Recreation complete! Enjoy your new setup!',
    appLabel: (name: string) => `Install ${name}`,
    widgetLabel: (name: string) => `Add ${name} widget`,
    themeLabel: (theme: string) => `Set system theme to ${theme === 'dark' ? 'Dark' : 'Light'}`,
    colorLabel: (colors: string[]) => `Set wallpaper with color palette: ${colors.join(', ')}`,
    installBtn: 'Get',
  },
} as const

export function RecreateChecklist({ postId, extractedTags, locale = 'ja' }: Props) {
  const t = copy[locale]
  const [isOpen, setIsOpen] = useState(false)
  const [checklist, setChecklist] = useState<SetupChecklistState | null>(null)

  // 1. Initialize checklist items from extractedTags
  useEffect(() => {
    const storageKey = `isearch-recreation-${postId}`
    const saved = localStorage.getItem(storageKey)

    // Collect initial items list
    const items: ChecklistItem[] = []

    // Apps (Apps + Dock Apps)
    const apps = Array.from(new Set([...(extractedTags.apps ?? []), ...(extractedTags.dock_apps ?? [])]))
    apps.forEach(app => {
      const link = extractedTags.app_links?.[app]
      items.push({
        id: `app-${app}`,
        type: 'app',
        label: t.appLabel(app),
        status: 'todo',
        linkUrl: link?.url,
        iconUrl: link?.icon,
      })
    })

    // Widgets
    const widgets = extractedTags.widgets ?? []
    widgets.forEach(w => {
      const link = extractedTags.widget_links?.[w]
      items.push({
        id: `widget-${w}`,
        type: 'widget',
        label: t.widgetLabel(w),
        status: 'todo',
        iconUrl: link?.icon,
      })
    })

    // Wallpaper Colors
    const colors = extractedTags.wallpaper_colors ?? []
    if (colors.length > 0) {
      items.push({
        id: 'wallpaper-colors',
        type: 'wallpaper',
        label: t.colorLabel(colors),
        status: 'todo',
      })
    }

    // Theme
    const theme = extractedTags.theme
    if (theme && (theme === 'dark' || theme === 'light')) {
      items.push({
        id: 'theme-mode',
        type: 'theme',
        label: t.themeLabel(theme),
        status: 'todo',
      })
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SetupChecklistState
        // Merge saved statuses with initial items list structure
        const mergedItems = items.map(item => {
          const savedItem = parsed.items.find(s => s.id === item.id)
          return savedItem ? { ...item, status: savedItem.status } : item
        })
        setChecklist({ postId, items: mergedItems })
      } catch {
        setChecklist({ postId, items })
      }
    } else {
      setChecklist({ postId, items })
    }
  }, [postId, extractedTags, t])

  if (!checklist || checklist.items.length === 0) return null

  const doneCount = checklist.items.filter(i => i.status === 'done').length
  const totalCount = checklist.items.length
  const progressPercent = Math.round((doneCount / totalCount) * 100)

  // Toggle item status
  function toggleItem(id: string) {
    if (!checklist) return
    const updatedItems = checklist.items.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'done' ? 'todo' : 'done' } as ChecklistItem
      }
      return item
    })

    const newState = { ...checklist, items: updatedItems }
    setChecklist(newState)
    localStorage.setItem(`isearch-recreation-${postId}`, JSON.stringify(newState))
  }

  return (
    <div className="gallery-caption rounded-[2rem] overflow-hidden border border-black/5 dark:border-white/5 transition-all duration-300">
      {/* Header / Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
            <Smartphone size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">{t.title}</h3>
            <p className="text-[11px] text-muted mt-0.5">
              {doneCount} / {totalCount} ({progressPercent}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {progressPercent === 100 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={12} />
              Done
            </span>
          )}
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Progress Bar (Always Visible if started) */}
      <div className="h-1.5 w-full bg-black/5 dark:bg-white/5">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Panel */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/5 space-y-4 bg-white/20 dark:bg-black/10">
          <p className="text-xs text-muted leading-relaxed">{t.description}</p>

          <ul className="space-y-2.5">
            {checklist.items.map(item => {
              const isDone = item.status === 'done'
              return (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                    isDone
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-muted line-through opacity-75'
                      : 'border-black/5 bg-white/30 dark:border-white/5 dark:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    {/* Interactive Checkbox */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-black/20 dark:border-white/25 hover:border-accent'
                      }`}
                    >
                      {isDone && <Check size={12} strokeWidth={3} />}
                    </span>

                    {/* Icon (if app or widget) */}
                    {item.iconUrl && (
                      <div className="relative w-6 h-6 shrink-0 rounded-md overflow-hidden shadow-sm">
                        <Image src={item.iconUrl} alt="" fill sizes="24px" className="object-cover" unoptimized />
                      </div>
                    )}

                    <span className="text-xs font-semibold truncate leading-tight select-none">
                      {item.label}
                    </span>
                  </button>

                  {/* App Store Download Button */}
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full hover:bg-accent hover:text-white transition-all"
                    >
                      <Download size={10} />
                      {t.installBtn}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>

          {progressPercent === 100 && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 p-3 rounded-2xl justify-center animate-fade-in">
              <CheckCircle2 size={16} />
              <span>{t.doneLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
