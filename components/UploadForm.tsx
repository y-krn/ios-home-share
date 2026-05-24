'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Cloud, ImageIcon, Loader2, ScanLine, Smartphone, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ListEditor, type AppInfo } from '@/components/EditTagsForm'
import type { ExtractedTags } from '@/lib/gemini'

const stepIcons = {
  prepare: Cloud,
  upload: Upload,
  analyze: ScanLine,
} as const

type StepId = keyof typeof stepIcons
type CreatedPost = { id?: string }
type Locale = 'ja' | 'en'

const copy = {
  ja: {
    steps: [
      { id: 'prepare', label: '準備' },
      { id: 'upload', label: '転送' },
      { id: 'analyze', label: '解析' },
    ],
    invalidFile: '画像ファイルを選択してください',
    uploadUrlError: 'アップロードURL取得失敗',
    uploadErrorPrefix: 'アップロード失敗',
    postError: (status: number) => `投稿失敗 (${status})`,
    networkError: 'ネットワークエラー。再試行してください。',
    selectScreenshot: 'スクショを選択',
    scannerDescription: '投稿前にiPhone画面らしさを確認し、アップロード後にAIがアプリとウィジェットを読み取ります。',
    selectedLabel: 'Selected',
    processingLabel: '処理中...',
    submitLabel: '投稿する',
    successBasePath: '/posts',
    fallbackPath: '/',
    confirmTitle: 'AI検出結果の確認・修正',
    confirmDesc: 'AIが自動検出したアプリやウィジェットが正しいか確認・修正してください。',
    cancelLabel: 'やり直す',
    publishLabel: 'この内容で投稿する',
    publishingLabel: '投稿中...',
    appsLabel: 'アプリ',
    appsPlaceholder: 'アプリ名で検索して追加',
    dockLabel: 'Dock',
    dockPlaceholder: 'Dockアプリを検索して追加',
    widgetsLabel: 'ウィジェット',
    widgetsPlaceholder: 'ウィジェットの提供アプリを検索',
    themeLabel: 'テーマ',
    noTheme: '未指定',
  },
  en: {
    steps: [
      { id: 'prepare', label: 'Prepare' },
      { id: 'upload', label: 'Upload' },
      { id: 'analyze', label: 'Analyze' },
    ],
    invalidFile: 'Choose an image file.',
    uploadUrlError: 'Could not prepare the upload.',
    uploadErrorPrefix: 'Upload failed',
    postError: (status: number) => `Post failed (${status})`,
    networkError: 'Network error. Please try again.',
    selectScreenshot: 'Choose screenshot',
    scannerDescription: 'We check that the image looks like an iPhone screen, then detect apps and widgets after upload.',
    selectedLabel: 'Selected',
    processingLabel: 'Processing...',
    submitLabel: 'Share setup',
    successBasePath: '/en/posts',
    fallbackPath: '/en',
    confirmTitle: 'Confirm & Edit AI Detections',
    confirmDesc: 'Please review and edit the apps and widgets automatically detected by the AI.',
    cancelLabel: 'Cancel',
    publishLabel: 'Share Setup',
    publishingLabel: 'Publishing...',
    appsLabel: 'Apps',
    appsPlaceholder: 'Search apps to add',
    dockLabel: 'Dock',
    dockPlaceholder: 'Search Dock apps to add',
    widgetsLabel: 'Widgets',
    widgetsPlaceholder: 'Search widget apps',
    themeLabel: 'Theme',
    noTheme: 'Unspecified',
  },
} satisfies Record<Locale, {
  steps: { id: StepId; label: string }[]
  invalidFile: string
  uploadUrlError: string
  uploadErrorPrefix: string
  postError: (status: number) => string
  networkError: string
  selectScreenshot: string
  scannerDescription: string
  selectedLabel: string
  processingLabel: string
  submitLabel: string
  successBasePath: string
  fallbackPath: string
  confirmTitle: string
  confirmDesc: string
  cancelLabel: string
  publishLabel: string
  publishingLabel: string
  appsLabel: string
  appsPlaceholder: string
  dockLabel: string
  dockPlaceholder: string
  widgetsLabel: string
  widgetsPlaceholder: string
  themeLabel: string
  noTheme: string
}>

const enApiErrorMap: Record<string, string> = {
  unauthorized: 'Login is required.',
  'login required': 'Email login is required to post.',
  'invalid path': 'The upload information is invalid.',
  'signed url生成失敗': 'Could not prepare the upload.',
  'アップロードURL取得失敗': 'Could not prepare the upload.',
  'アップロード済みファイルが見つかりません': 'Could not find the uploaded file. Please try again.',
  'カメラで撮影した写真は投稿できません。スクリーンショットを使用してください。': 'Photos taken with a camera cannot be posted. Please upload an iPhone screenshot.',
  'iOSホーム画面の縦長スクリーンショットを使用してください。': 'Please upload a vertical iPhone home screen or lock screen screenshot.',
  'AI解析に失敗しました。再試行してください。': 'Could not analyze the screenshot. Please try again.',
  'iOSホーム画面またはロック画面のスクリーンショットのみ投稿可能です。': 'Only iPhone home screen or lock screen screenshots can be posted.',
  'アップロードに失敗しました': 'Upload failed. Please try again.',
}

function formatApiError(error: unknown, fallback: string, locale: Locale) {
  if (typeof error !== 'string' || !error.trim()) return fallback
  if (locale === 'ja') return error

  const mapped = enApiErrorMap[error]
  if (mapped) return mapped

  // Avoid leaking untranslated Japanese API messages into the English upload flow.
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(error)) return fallback

  return error
}

export function UploadForm({ locale = 'ja' }: { locale?: Locale } = {}) {
  const t = copy[locale]
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeStep, setActiveStep] = useState<StepId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // New confirmation state & editable tags states
  const [analyzeResult, setAnalyzeResult] = useState<{
    tempRedactedPath: string
    imageUrl: string
    extractedTags: ExtractedTags
  } | null>(null)
  const [apps, setApps] = useState<string[]>([])
  const [dockApps, setDockApps] = useState<string[]>([])
  const [widgets, setWidgets] = useState<string[]>([])
  const [theme, setTheme] = useState<string>('')
  const [appLinks, setAppLinks] = useState<Record<string, AppInfo>>({})
  const [widgetLinks, setWidgetLinks] = useState<Record<string, AppInfo>>({})
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  useEffect(() => {
    if (analyzeResult) {
      const tags = analyzeResult.extractedTags
      setApps(tags.apps ?? [])
      setDockApps(tags.dock_apps ?? [])
      setWidgets(tags.widgets ?? [])
      setTheme(tags.theme ?? '')
      setAppLinks(tags.app_links ?? {})
      setWidgetLinks(tags.widget_links ?? {})
    }
  }, [analyzeResult])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError(t.invalidFile); return }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      // 1. signed upload URL 取得
      setActiveStep('prepare')
      const localeParam = locale === 'en' ? '?locale=en' : ''
      const urlRes = await fetch(`/api/posts/upload-url${localeParam}`, { method: 'POST' })
      if (!urlRes.ok) {
        const d = await urlRes.json().catch(() => ({}))
        setError(formatApiError(d.error, t.uploadUrlError, locale))
        setUploading(false)
        setActiveStep(null)
        return
      }
      const { token, path } = await urlRes.json() as { token: string; path: string }

      // 2. Supabase Storage 直アップロード (Vercel経由しない → サイズ制限なし)
      setActiveStep('upload')
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from('screenshots')
        .uploadToSignedUrl(path, token, file, { contentType: file.type })
      if (upErr) {
        setError(`${t.uploadErrorPrefix}: ${upErr.message}`)
        setUploading(false)
        setActiveStep(null)
        return
      }

      // 3. サーバ側でAI解析 + 圧縮 (確認用の一時ファイルを生成するエンドポイントへ)
      setActiveStep('analyze')
      const res = await fetch(`/api/posts/analyze${localeParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(formatApiError(d.error, t.postError(res.status), locale))
        setUploading(false)
        setActiveStep(null)
        return
      }
      const result = await res.json().catch(() => null) as {
        tempRedactedPath: string
        imageUrl: string
        extractedTags: ExtractedTags
      } | null

      if (!result || !result.tempRedactedPath || !result.imageUrl || !result.extractedTags) {
        setError(t.postError(500))
        setUploading(false)
        setActiveStep(null)
        return
      }

      setAnalyzeResult(result)
      setUploading(false)
      setActiveStep(null)
    } catch {
      setError(t.networkError)
      setUploading(false)
      setActiveStep(null)
    }
  }

  function onCancel() {
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    setFile(null)
    setAnalyzeResult(null)
    setApps([])
    setDockApps([])
    setWidgets([])
    setTheme('')
    setAppLinks({})
    setWidgetLinks({})
    setError(null)
    setUploading(false)
    setActiveStep(null)
    setPublishing(false)
  }

  async function onPublish() {
    if (!analyzeResult) return
    setPublishing(true)
    setError(null)

    try {
      const localeParam = locale === 'en' ? '?locale=en' : ''
      const finalTags: ExtractedTags = {
        is_home_screen: analyzeResult.extractedTags.is_home_screen,
        is_lock_screen: analyzeResult.extractedTags.is_lock_screen,
        screen_type: analyzeResult.extractedTags.screen_type,
        apps,
        dock_apps: dockApps,
        widgets,
        theme: theme as 'dark' | 'light' | '',
        app_links: appLinks,
        widget_links: widgetLinks,
        wallpaper_colors: analyzeResult.extractedTags.wallpaper_colors,
      }

      const res = await fetch(`/api/posts${localeParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempRedactedPath: analyzeResult.tempRedactedPath,
          extractedTags: finalTags,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(formatApiError(d.error, t.postError(res.status), locale))
        setPublishing(false)
        return
      }

      const post = await res.json().catch(() => null) as CreatedPost | null
      router.push(post?.id ? `${t.successBasePath}/${post.id}?posted=1` : t.fallbackPath)
      router.refresh()
    } catch {
      setError(t.networkError)
      setPublishing(false)
    }
  }

  if (analyzeResult) {
    const isLockScreen = analyzeResult.extractedTags.screen_type === 'lock' || analyzeResult.extractedTags.is_lock_screen
    const screenLabel = isLockScreen
      ? (locale === 'en' ? 'Lock Screen' : 'Lock screen')
      : (locale === 'en' ? 'Home Screen' : 'Home setup')

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
                  src={analyzeResult.imageUrl}
                  alt="redacted preview"
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

        <section className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-black leading-tight">
              {t.confirmTitle}
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              {t.confirmDesc}
            </p>
          </div>

          {!isLockScreen && (
            <>
              <ListEditor
                label={t.appsLabel}
                items={apps}
                setItems={setApps}
                placeholder={t.appsPlaceholder}
                links={appLinks}
                setLinks={setAppLinks}
                locale={locale}
              />
              <ListEditor
                label={t.dockLabel}
                items={dockApps}
                setItems={setDockApps}
                placeholder={t.dockPlaceholder}
                links={appLinks}
                setLinks={setAppLinks}
                locale={locale}
              />
            </>
          )}

          <ListEditor
            label={t.widgetsLabel}
            items={widgets}
            setItems={setWidgets}
            placeholder={t.widgetsPlaceholder}
            links={widgetLinks}
            setLinks={setWidgetLinks}
            locale={locale}
          />

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

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={publishing}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold border border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.cancelLabel}
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {publishing ? t.publishingLabel : t.publishLabel}
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-[minmax(260px,0.92fr)_minmax(0,1fr)] md:items-start">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="gallery-shelf rounded-[2.25rem] p-4 sm:p-5 text-left transition duration-300 hover:-translate-y-1 active:scale-[0.99]"
      >
        <div className="relative mx-auto max-w-[18rem]">
          <div className="phone-frame relative aspect-[9/19.5] overflow-hidden rounded-[2.85rem] p-[9px]">
            <div className="relative h-full overflow-hidden rounded-[2.32rem] bg-black [clip-path:inset(0_round_2.32rem)]">
              {preview ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <Image
                    src={preview}
                    alt="preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between bg-[linear-gradient(160deg,#d8c5a8,#e8efe8_44%,#7d5b45)] p-5 text-white">
                  <div className="space-y-4">
                    <div className="mx-auto h-6 w-24 rounded-full bg-black" />
                    <div className="grid grid-cols-4 gap-3 pt-8">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span
                          key={i}
                          className="aspect-square rounded-[1.1rem] bg-white/75 shadow-lg shadow-black/10"
                          style={{ opacity: 0.92 - (i % 4) * 0.08 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/28 p-3 backdrop-blur-md">
                    <div className="grid grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span key={i} className="aspect-square rounded-[1rem] bg-white/80" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.2),transparent_28%,transparent_74%,rgba(255,255,255,0.08))]" />
              {!preview && (
                <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-3xl bg-black/42 p-4 text-center text-white backdrop-blur-md">
                  <ImageIcon size={26} className="mx-auto mb-2" />
                  <div className="text-sm font-bold">{t.selectScreenshot}</div>
                  <div className="text-[11px] text-white/75">PNG / JPG</div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute left-[-3px] top-[18%] h-12 w-1 rounded-l-full bg-black/70" />
          <div className="absolute right-[-3px] top-[26%] h-16 w-1 rounded-r-full bg-black/70" />
        </div>
      </button>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <div className="space-y-5">
        <div className="gallery-caption rounded-[2rem] p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white">
              <Smartphone size={19} />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">Setup scanner</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t.scannerDescription}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            {t.steps.map((step, index) => {
              const Icon = stepIcons[step.id]
              const activeIndex = activeStep ? t.steps.findIndex(s => s.id === activeStep) : -1
              const isActive = step.id === activeStep
              const isDone = activeIndex > index
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
                    isActive
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : isDone
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-accent'
                        : 'border-black/5 bg-white/25 text-muted dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 dark:bg-white/10">
                    {isDone ? <CheckCircle2 size={16} /> : isActive ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                  </div>
                  <span className="text-sm font-bold">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {file && (
          <div className="gallery-caption rounded-3xl p-4">
            <div className="text-[11px] font-bold uppercase text-muted">{t.selectedLabel}</div>
            <div className="mt-1 truncate text-sm font-semibold">{file.name}</div>
            <div className="mt-1 text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
        )}

        {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold text-white bg-accent shadow-lg shadow-emerald-950/10 hover:bg-accent-strong hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? t.processingLabel : t.submitLabel}
        </button>
      </div>
    </form>
  )
}
