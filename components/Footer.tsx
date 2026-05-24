'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Languages, ShieldCheck } from 'lucide-react'

export function Footer() {
  const pathname = usePathname()
  const isEnglish = pathname?.startsWith('/en')
  const termsHref = isEnglish ? '/en/terms' : '/terms'
  const privacyHref = isEnglish ? '/en/privacy' : '/privacy'
  const termsLabel = isEnglish ? 'Terms' : '利用規約'
  const privacyLabel = isEnglish ? 'Privacy' : 'プライバシーポリシー'

  return (
    <footer className="max-w-5xl mx-auto px-4 py-8 mt-12">
      <div className="gallery-caption mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-muted">
        <Link href={termsHref} prefetch={false} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-accent transition-colors">
          <FileText size={13} />
          {termsLabel}
        </Link>
        <Link href={privacyHref} prefetch={false} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-accent transition-colors">
          <ShieldCheck size={13} />
          {privacyLabel}
        </Link>
        <Link
          href="/en"
          prefetch={false}
          onClick={() => {
            document.cookie = "pref-locale=en; path=/; max-age=31536000; SameSite=Lax"
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-accent transition-colors"
        >
          <Languages size={13} />
          English
        </Link>
        <Link
          href="/"
          prefetch={false}
          onClick={() => {
            document.cookie = "pref-locale=ja; path=/; max-age=31536000; SameSite=Lax"
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-accent transition-colors"
        >
          日本語
        </Link>
        <span className="px-2 py-1">© iSetup.app</span>
      </div>
    </footer>
  )
}
