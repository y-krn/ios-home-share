'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ImagePlus, SearchX, Check, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ensureAnonymousUser } from '@/lib/auth'
import { PostCard } from './PostCard'
import type { PopularApp } from '@/lib/popular-apps'

type Post = {
  id: string
  image_url: string
  like_count: number
  extracted_tags: Record<string, unknown>
  created_at: string
  anon_user_id: string | null
}

type Props = {
  initialPosts: Post[]
  tag?: string
  trackId?: string
  theme?: string
  type?: string
  showEdit?: boolean
  emptyTitle?: string
  emptyDescription?: string
  filteredEmptyTitle?: string
  filteredEmptyDescription?: string
  loadingLabel?: string
  locale?: 'ja' | 'en'
  popularApps?: PopularApp[]
}

export function PostGrid({
  initialPosts,
  tag,
  trackId,
  theme,
  type,
  showEdit,
  emptyTitle = 'まだ投稿がありません',
  emptyDescription = '最初のiPhone画面が投稿されると、ここにギャラリーとして並びます。',
  filteredEmptyTitle = '条件に合う投稿がありません',
  filteredEmptyDescription = '別のアプリ、ウィジェット、テーマで探してみてください。',
  loadingLabel = '読み込み中...',
  locale = 'ja',
  popularApps = [],
}: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(
    initialPosts.at(-1)?.created_at ?? null
  )
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [loading, setLoading] = useState(false)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchLiked = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    await ensureAnonymousUser()
    const params = new URLSearchParams()
    ids.forEach(id => params.append('id', id))
    const res = await fetch(`/api/likes/bulk?${params}`)
    if (!res.ok) return
    const data: Record<string, boolean> = await res.json()
    setLikedMap(prev => ({ ...prev, ...data }))
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return
    setLoading(true)
    const params = new URLSearchParams({ cursor })
    if (selectedApps.length > 0) {
      params.set('ownedApps', selectedApps.join(','))
    } else {
      if (trackId) params.set('trackId', trackId)
      else if (tag) params.set('tag', tag)
    }
    if (theme) params.set('theme', theme)
    if (type) params.set('type', type)
    const res = await fetch(`/api/posts?${params}`)
    const data: Post[] = await res.json()
    setPosts(p => [...p, ...data])
    setCursor(data.at(-1)?.created_at ?? null)
    setHasMore(data.length === 20)
    setLoading(false)
    fetchLiked(data.map(p => p.id))
  }, [loading, hasMore, cursor, tag, trackId, theme, type, selectedApps, fetchLiked])

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const resetAndFetch = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedApps.length > 0) {
        params.set('ownedApps', selectedApps.join(','))
      } else {
        if (trackId) params.set('trackId', trackId)
        else if (tag) params.set('tag', tag)
      }
      if (theme) params.set('theme', theme)
      if (type) params.set('type', type)

      try {
        const res = await fetch(`/api/posts?${params}`)
        const data: Post[] = await res.json()
        setPosts(data)
        setCursor(data.at(-1)?.created_at ?? null)
        setHasMore(data.length === 20)
        fetchLiked(data.map(p => p.id))
      } catch (err) {
        console.error('Error filtering posts:', err)
      } finally {
        setLoading(false)
      }
    }

    resetAndFetch()
  }, [selectedApps, tag, trackId, theme, type, fetchLiked])

  const toggleApp = (appName: string) => {
    setSelectedApps(prev =>
      prev.includes(appName)
        ? prev.filter(name => name !== appName)
        : [...prev, appName]
    )
  }

  useEffect(() => {
    fetchLiked(initialPosts.map(p => p.id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore])

  const showFilter = popularApps.length > 0

  if (posts.length === 0) {
    const isFiltered = !!(tag || trackId || theme || selectedApps.length > 0)
    const uploadHref = locale === 'en' ? '/en/upload' : '/upload'
    return (
      <>
        {showFilter && (
          <div className="gallery-caption rounded-[2rem] p-5 sm:p-6 mb-6 space-y-4 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black">
                  {locale === 'en' ? 'Filter by apps you own' : '持っているアプリで絞り込む'}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {locale === 'en' 
                    ? 'Select apps to find setups that feature them.' 
                    : '普段使っているアプリを選ぶと、それらが含まれるセットアップを表示します。'}
                </p>
              </div>
              {selectedApps.length > 0 && (
                <button
                  onClick={() => setSelectedApps([])}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-accent transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  {locale === 'en' ? 'Clear filter' : 'リセット'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1 max-h-[160px] overflow-y-auto scrollbar-hide">
              {popularApps.map((app) => {
                const isSelected = selectedApps.includes(app.name)
                const display = app.info?.trackName ?? app.name
                return (
                  <button
                    key={app.name}
                    onClick={() => toggleApp(app.name)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition duration-200 cursor-pointer select-none active:scale-[0.97] border ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent shadow-sm'
                        : 'glass-soft border-black/5 hover:border-black/20 hover:scale-[1.02] text-muted'
                    }`}
                  >
                    {app.info?.icon ? (
                      <Image
                        src={app.info.icon}
                        alt={display}
                        width={18}
                        height={18}
                        className="rounded-[0.38rem] shadow-sm flex-shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[0.38rem] bg-white/30 text-[9px] text-muted flex-shrink-0">?</div>
                    )}
                    <span className="truncate max-w-[120px]">{display}</span>
                    {isSelected && <Check size={11} className="stroke-[3]" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="gallery-shelf rounded-[2.25rem] px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent/10 text-accent">
            {isFiltered ? <SearchX size={28} /> : <ImagePlus size={28} />}
          </div>
          <h2 className="mt-5 text-xl font-black">
            {isFiltered ? filteredEmptyTitle : emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {isFiltered ? filteredEmptyDescription : emptyDescription}
          </p>
          {isFiltered && (
            <Link
              href={uploadHref}
              prefetch={false}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition-all hover:bg-accent-strong hover:scale-[1.01] active:scale-95"
            >
              {locale === 'en' ? 'Share your setup' : '自分のセットアップを投稿'}
            </Link>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {showFilter && (
        <div className="gallery-caption rounded-[2rem] p-5 sm:p-6 mb-6 space-y-4 shadow-inner">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black">
                {locale === 'en' ? 'Filter by apps you own' : '持っているアプリで絞り込む'}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {locale === 'en' 
                  ? 'Select apps to find setups that feature them.' 
                  : '普段使っているアプリを選ぶと、それらが含まれるセットアップを表示します。'}
              </p>
            </div>
            {selectedApps.length > 0 && (
              <button
                onClick={() => setSelectedApps([])}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-accent transition active:scale-95 cursor-pointer"
              >
                <RotateCcw size={13} />
                {locale === 'en' ? 'Clear filter' : 'リセット'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1 max-h-[160px] overflow-y-auto scrollbar-hide">
            {popularApps.map((app) => {
              const isSelected = selectedApps.includes(app.name)
              const display = app.info?.trackName ?? app.name
              return (
                <button
                  key={app.name}
                  onClick={() => toggleApp(app.name)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition duration-200 cursor-pointer select-none active:scale-[0.97] border ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-accent shadow-sm'
                      : 'glass-soft border-black/5 hover:border-black/20 hover:scale-[1.02] text-muted'
                  }`}
                >
                  {app.info?.icon ? (
                    <Image
                      src={app.info.icon}
                      alt={display}
                      width={18}
                      height={18}
                      className="rounded-[0.38rem] shadow-sm flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[0.38rem] bg-white/30 text-[9px] text-muted flex-shrink-0">?</div>
                  )}
                  <span className="truncate max-w-[120px]">{display}</span>
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 sm:gap-6 max-w-md sm:max-w-none mx-auto">
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            priority={i < 3}
            showEdit={showEdit}
            featured={!showEdit && i === 0 && !tag && !trackId && !theme && selectedApps.length === 0}
            initialLiked={likedMap[post.id] ?? false}
            locale={locale}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">{loadingLabel}</div>
      )}
    </>
  )
}
