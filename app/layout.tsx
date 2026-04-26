import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { AuthHeader } from '@/components/AuthHeader'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'homescreen.share',
  description: 'iOSホーム画面を共有しよう',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geist.variable} antialiased`}>
        <ThemeProvider>
          <header className="sticky top-0 z-40 glass-soft">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link
                href="/"
                className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-fuchsia-500 dark:from-indigo-300 dark:to-fuchsia-300 bg-clip-text text-transparent"
              >
                homescreen.share
              </Link>
              <AuthHeader />
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
