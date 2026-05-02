import Link from 'next/link'
import { FileText, ShieldCheck } from 'lucide-react'

export function Footer() {
  return (
    <footer className="max-w-5xl mx-auto px-4 py-8 mt-12">
      <div className="gallery-caption mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-muted">
        <Link href="/terms" prefetch={false} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-accent transition-colors">
          <FileText size={13} />
          利用規約
        </Link>
        <Link href="/privacy" prefetch={false} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-accent transition-colors">
          <ShieldCheck size={13} />
          プライバシーポリシー
        </Link>
        <span className="px-2 py-1">© iSetup.app</span>
      </div>
    </footer>
  )
}
