import { Suspense } from 'react'
import { UploadForm } from '@/components/UploadForm'
import { LoginForm } from '@/components/LoginForm'
import { AlertTriangle, Folder, Mail, ScanLine } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { getAuthenticatedUser } from '@/lib/auth-server'

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
              <span className="font-semibold">個人情報を含むスクショは投稿しないでください。</span>
              <span className="text-muted">通知・連絡先・位置情報・写真サムネなどが映り込んでいないか確認を。</span>
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

      {user ? (
        <UploadForm />
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(260px,0.9fr)_minmax(0,1fr)] md:items-start">
          <div className="gallery-shelf rounded-[2.25rem] p-5">
            <div className="phone-frame mx-auto aspect-[9/19.5] max-w-[18rem] rounded-[2.85rem] p-[9px]">
              <div className="flex h-full flex-col items-center justify-center rounded-[2.32rem] bg-black/90 p-6 text-center text-white">
                <Mail size={34} />
                <div className="mt-4 text-lg font-black">Login required</div>
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  投稿にはメールリンク認証が必要です。
                </p>
              </div>
            </div>
          </div>
          <div className="gallery-caption rounded-[2rem] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={17} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <span className="font-semibold">投稿にはメール認証が必要。</span>
                <span className="text-muted">送信されるリンクを開けばサインイン完了。このページに戻ります。</span>
              </p>
            </div>
            <Suspense>
              <LoginForm nextOverride="/upload" />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
