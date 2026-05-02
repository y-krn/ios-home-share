'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Cloud, ImageIcon, Loader2, ScanLine, Smartphone, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const steps = [
  { id: 'prepare', label: '準備', icon: Cloud },
  { id: 'upload', label: '転送', icon: Upload },
  { id: 'analyze', label: '解析', icon: ScanLine },
] as const

type StepId = typeof steps[number]['id']
type CreatedPost = { id?: string }

export function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [activeStep, setActiveStep] = useState<StepId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('画像ファイルを選択してください'); return }
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
      const urlRes = await fetch('/api/posts/upload-url', { method: 'POST' })
      if (!urlRes.ok) {
        const d = await urlRes.json().catch(() => ({}))
        setError(d.error ?? 'アップロードURL取得失敗')
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
        setError(`アップロード失敗: ${upErr.message}`)
        setUploading(false)
        setActiveStep(null)
        return
      }

      // 3. サーバ側でAI解析 + 圧縮
      setActiveStep('analyze')
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `投稿失敗 (${res.status})`)
        setUploading(false)
        setActiveStep(null)
        return
      }
      const post = await res.json().catch(() => null) as CreatedPost | null
      router.push(post?.id ? `/posts/${post.id}?posted=1` : '/')
      router.refresh()
    } catch {
      setError('ネットワークエラー。再試行してください。')
      setUploading(false)
      setActiveStep(null)
    }
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
            <div className="relative h-full overflow-hidden rounded-[2.32rem] bg-black">
              {preview ? (
                <Image
                  src={preview}
                  alt="preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                />
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
                  <div className="text-sm font-bold">スクショを選択</div>
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
                投稿前にホーム画面らしさを確認し、アップロード後にAIがアプリとウィジェットを読み取ります。
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const activeIndex = activeStep ? steps.findIndex(s => s.id === activeStep) : -1
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
            <div className="text-[11px] font-bold uppercase text-muted">Selected</div>
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
          {uploading ? '処理中...' : '投稿する'}
        </button>
      </div>
    </form>
  )
}
