import { UploadForm } from '@/components/UploadForm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Folder } from 'lucide-react'
import { getAuthenticatedUser } from '@/lib/auth-server'

export default async function UploadPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/upload')
  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center justify-center w-9 h-9 rounded-full glass-soft text-muted hover:text-accent transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">ホーム画面を投稿</h1>
      </div>
      <p className="text-sm text-muted leading-relaxed">
        スクリーンショットをアップロードするとAIが自動でアプリ名・ウィジェット・テーマを解析。
      </p>

      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">個人情報を含むスクショは投稿しないでください。</span>
            <span className="text-muted">通知バナー・連絡先・位置情報・写真サムネ等が映り込んでいないか確認を。</span>
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Folder size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">フォルダ内アプリは解析対象外。</span>
            <span className="text-muted">タグ付けしたいアプリはフォルダの外に出してから撮影。</span>
          </p>
        </div>
      </div>

      <UploadForm />
    </div>
  )
}
