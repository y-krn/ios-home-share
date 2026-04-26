import { UploadForm } from '@/components/UploadForm'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Folder } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold">ホーム画面を投稿</h1>
      </div>
      <p className="text-sm text-gray-500">
        スクリーンショットをアップロードするとAIが自動でアプリ名・ウィジェット・テーマを解析します。
      </p>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">個人情報を含むスクショは投稿しないでください。</span>
            通知バナー・連絡先・位置情報・写真サムネ等が映り込んでいないか確認を。
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Folder size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">フォルダ内アプリは解析対象外です。</span>
            自動的にタグ付けしたいアプリはフォルダの外に出してから撮影してください。
          </p>
        </div>
      </div>

      <UploadForm />
    </div>
  )
}
