'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, ImageIcon } from 'lucide-react'

export function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('画像ファイルを選択してください'); return }
    if (f.size > 10 * 1024 * 1024) { setError('10MB以下の画像を選択してください'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/posts', { method: 'POST', body: formData })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'アップロードに失敗しました')
      setUploading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div
        onClick={() => inputRef.current?.click()}
        className="glass rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:scale-[1.01] transition-transform"
        style={{ minHeight: 320 }}
      >
        {preview ? (
          <div className="relative w-full" style={{ aspectRatio: '9/19.5' }}>
            <Image src={preview} alt="preview" fill sizes="(max-width: 640px) 100vw, 384px" className="object-contain rounded-3xl" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-fuchsia-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ImageIcon size={28} strokeWidth={1.5} className="text-white" />
            </div>
            <p className="text-sm font-medium">スクリーンショットを選択</p>
            <p className="text-xs text-muted">PNG / JPG・10MB以下</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Upload size={16} />
        {uploading ? 'AI解析・圧縮中...' : '投稿する'}
      </button>
    </form>
  )
}
