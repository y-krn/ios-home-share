import { UploadForm } from '@/components/UploadForm'
import { AlertTriangle, Folder, ScanLine } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { getAuthenticatedUser } from '@/lib/auth-server'

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function UploadPage() {
  const user = await getAuthenticatedUser()
  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-4">
        <BackButton fallback="/" variant="text" />
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
            <ScanLine size={13} />
            Upload Scanner
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">iPhone画面を投稿</h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed">
            iOSホーム画面・ロック画面のスクリーンショットを選ぶと、AIがアプリ・ウィジェット・テーマを解析してギャラリーに追加します。
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={17} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">個人情報はAIが自動でぼかし保護します。</span>
              <span className="text-muted">通知・カレンダー等の映り込みは自動検出されますが、投稿前にプレビューで状態をご確認ください。</span>
            </p>
          </div>
        </div>
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <Folder size={17} className="text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">ホーム画面のフォルダ内アプリは解析対象外。</span>
              <span className="text-muted">タグ付けしたいアプリはフォルダの外に出してから撮影。</span>
            </p>
          </div>
        </div>
      </div>

      <UploadForm isAuthenticated={!!user} />

    </div>
  )
}
