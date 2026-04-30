import Link from 'next/link'

export function Footer() {
  return (
    <footer className="max-w-5xl mx-auto px-4 py-8 mt-12">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
        <Link href="/terms" className="hover:text-accent transition-colors">利用規約</Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="hover:text-accent transition-colors">プライバシーポリシー</Link>
        <span aria-hidden>·</span>
        <span>© homescreen.share</span>
      </div>
    </footer>
  )
}
