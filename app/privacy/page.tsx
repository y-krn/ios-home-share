import { BackButton } from '@/components/BackButton'
import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'プライバシーポリシー — iSetup.app',
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <BackButton fallback="/" variant="text" />
        <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
          <ShieldCheck size={13} />
          Privacy Note
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">プライバシーポリシー</h1>
          <p className="text-xs font-semibold text-muted">最終更新日: 2026年4月28日</p>
        </div>
      </header>

      <div className="gallery-shelf rounded-[2.25rem] p-4 sm:p-6 space-y-4">
        <Section title="1. 取得する情報">
          <ul className="list-disc pl-6 space-y-1">
            <li>メールアドレス (Magic Link 認証で使用)</li>
            <li>投稿されたスクリーンショット画像</li>
            <li>AI解析結果のタグ (アプリ名・ウィジェット・テーマ等)</li>
            <li>いいね・編集・削除の操作ログ</li>
            <li>アクセスログ (IPアドレス・UA・参照元等、Vercel が標準収集)</li>
          </ul>
        </Section>

        <Section title="2. 利用目的">
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスの提供 (投稿表示・認証・編集権限管理)</li>
            <li>AI による画像解析・タグ自動生成</li>
            <li>App Store 情報の取得・表示</li>
            <li>不正利用の防止・サービス改善</li>
          </ul>
        </Section>

        <Section title="3. 第三者提供">
          <p>本サービスは以下の第三者サービスを利用しています。投稿画像・メールアドレス等が当該サービスに送信されます。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> (Supabase Inc.) — データベース・認証・画像ストレージ</li>
            <li><strong>Google Gemini API</strong> (Google LLC) — 投稿画像のAI解析</li>
            <li><strong>Apple iTunes Search API</strong> (Apple Inc.) — アプリ情報の取得 (画像送信なし)</li>
            <li><strong>Resend</strong> (Resend Inc.) — Magic Link メール送信</li>
            <li><strong>Vercel</strong> (Vercel Inc.) — ホスティング・アクセスログ</li>
          </ul>
          <p>各サービスのプライバシーポリシーに従い情報が取り扱われます。</p>
        </Section>

        <Section title="4. AI処理について">
          <p>
            投稿時、画像は Google Gemini API に送信され、含まれるアプリ名・ウィジェット・テーマ等が抽出されます。
            Google のポリシーにより、API経由で送信されたデータはモデル学習に使用されません (2026年4月時点)。
          </p>
          <p>個人情報を含む画像は投稿しないでください。</p>
        </Section>

        <Section title="5. データの保管期間">
          <ul className="list-disc pl-6 space-y-1">
            <li>投稿コンテンツ: 利用者が削除するまで保管</li>
            <li>アカウント情報: 退会まで保管</li>
            <li>アクセスログ: Vercel の標準保管期間に従う</li>
          </ul>
        </Section>

        <Section title="6. 利用者の権利">
          <p>利用者は、自身の投稿の閲覧・編集・削除をマイページから行えます。アカウント削除をご希望の場合は、お問い合わせ窓口までご連絡ください。</p>
        </Section>

        <Section title="7. Cookieの使用">
          <p>本サービスは認証セッション維持のため Cookie を使用します。Cookie を無効化するとログイン機能が利用できません。</p>
        </Section>

        <Section title="8. ポリシーの変更">
          <p>本ポリシーは予告なく変更される場合があります。変更後のポリシーは、本サービス上に掲示された時点で効力を生じます。</p>
        </Section>

        <Section title="9. お問い合わせ">
          <p className="text-sm">
            メール: <a href="mailto:contact@isetup.app" className="text-accent hover:underline">contact@isetup.app</a>
          </p>
        </Section>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gallery-caption rounded-3xl p-4 space-y-2">
      <h2 className="text-base font-black">{title}</h2>
      <div className="text-sm leading-relaxed text-muted space-y-2">{children}</div>
    </section>
  )
}
