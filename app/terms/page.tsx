import { BackButton } from '@/components/BackButton'
import { FileText } from 'lucide-react'

export const metadata = {
  title: '利用規約 — iSetup.app',
}

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <BackButton fallback="/" variant="text" />
        <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
          <FileText size={13} />
          Legal Note
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">利用規約</h1>
          <p className="text-xs font-semibold text-muted">最終更新日: 2026年4月28日</p>
        </div>
      </header>

      <div className="gallery-shelf rounded-[2.25rem] p-4 sm:p-6 space-y-4">
        <Section title="第1条 (適用)">
          <p>
            本規約は、iSetup.app (以下「本サービス」) の提供条件および本サービスの利用に関する運営者と利用者との間の権利義務関係を定めるものです。
            利用者は、本規約に同意した上で本サービスを利用するものとします。
          </p>
        </Section>

        <Section title="第2条 (利用登録)">
          <p>
            投稿・編集・削除機能の利用にはメールアドレスによるサインインが必要です。
            利用者は、自身の責任においてメールアドレスを管理するものとします。
          </p>
        </Section>

        <Section title="第3条 (禁止事項)">
          <p>利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>個人情報を含むスクリーンショットの投稿 (通知バナー・連絡先・位置情報・写真サムネ等)</li>
            <li>第三者の著作権・肖像権・プライバシー権を侵害する投稿</li>
            <li>iOSホーム画面・ロック画面以外の画像の投稿 (写真・他アプリ画面等)</li>
            <li>公序良俗に反する画像・差別的・性的・暴力的なコンテンツの投稿</li>
            <li>商業目的の宣伝・スパム行為</li>
            <li>運営者または第三者になりすます行為</li>
            <li>本サービスの運営を妨害する行為 (過度な自動投稿・サーバ負荷等)</li>
            <li>法令または本規約に違反する行為</li>
          </ul>
        </Section>

        <Section title="第4条 (投稿コンテンツの取扱い)">
          <p>
            利用者が投稿したスクリーンショットおよびタグ情報の著作権は、利用者に帰属します。
            ただし、本サービス上での表示・配信・サムネイル生成等の目的で、運営者は無償・非独占的に利用できるものとします。
          </p>
          <p>
            投稿されたスクリーンショットは、Google が提供する Gemini API に送信され、AI による画像解析が行われます。
            詳細はプライバシーポリシーをご確認ください。
          </p>
        </Section>

        <Section title="第5条 (削除権限)">
          <p>運営者は、以下に該当する投稿について、利用者への事前通知なく削除できるものとします。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>第3条の禁止事項に違反する投稿</li>
            <li>第三者から正当な削除請求があった投稿</li>
            <li>その他、運営者が不適切と判断した投稿</li>
          </ul>
        </Section>

        <Section title="第6条 (App Store商標等)">
          <p>
            本サービスは Apple Inc. が提供する iTunes Search API を利用してアプリ情報を表示しています。
            App Store ロゴ・アプリアイコンは、各権利者に帰属します。本サービスは Apple Inc. と提携・関連していません。
          </p>
        </Section>

        <Section title="第7条 (免責)">
          <p>
            本サービスは現状有姿で提供されます。AI解析結果の正確性・サービスの中断・データの消失等について、運営者は一切の責任を負いません。
            利用者は、自己の責任において本サービスを利用するものとします。
          </p>
        </Section>

        <Section title="第8条 (規約の変更)">
          <p>
            運営者は、必要と判断した場合、利用者に通知することなく本規約を変更できるものとします。
            変更後の規約は、本サービス上に掲示された時点で効力を生じるものとします。
          </p>
        </Section>

        <Section title="第9条 (準拠法・管轄)">
          <p>
            本規約の解釈にあたっては、日本法を準拠法とします。
            本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
          </p>
        </Section>

        <Section title="第10条 (お問い合わせ)">
          <p>本規約に関するお問い合わせは、以下までご連絡ください。</p>
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
