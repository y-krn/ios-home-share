import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Mail, ShieldCheck } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { LoginForm } from '@/components/LoginForm'

type Props = {
  searchParams: Promise<{
    error?: string
    error_code?: string
    error_description?: string
  }>
}

export const metadata: Metadata = {
  title: 'Log in — iSetup',
  description: 'Log in to iSetup with a magic link to share and manage your iPhone setup.',
  alternates: {
    canonical: '/en/login',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function EnglishLoginPage({ searchParams }: Props) {
  const { error, error_code, error_description } = await searchParams
  const hasAuthError = !!(error || error_code || error_description)
  const authErrorText = error_code === 'otp_expired' || error === 'invalid'
    ? 'This login link has expired. Enter your email address to receive a new link.'
    : error_description
      ? decodeURIComponent(error_description.replace(/\+/g, ' '))
      : 'Login failed. Please send a new magic link and try again.'

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[minmax(260px,0.9fr)_minmax(0,1fr)] md:items-start">
      <section className="space-y-4">
        <BackButton fallback="/en" variant="text" label="Back" />
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
            <ShieldCheck size={13} />
            Access Pass
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">Log in</h1>
          <p className="text-sm text-muted leading-relaxed">
            Use a magic link from your inbox to post, edit, and manage your gallery. No password needed.
          </p>
        </div>
        {hasAuthError && (
          <div className="rounded-3xl bg-danger/10 p-4 text-sm font-semibold leading-relaxed text-danger">
            {authErrorText}
          </div>
        )}
      </section>

      <section className="gallery-shelf w-full order-3 rounded-[2.25rem] p-4 sm:p-5 md:order-none">
        <div className="relative mx-auto w-full max-w-[18rem]">
          <div className="relative w-full rounded-[2.25rem] bg-[linear-gradient(180deg,rgb(var(--surface)/0.64),rgb(var(--surface)/0.24))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_30px_68px_-40px_rgba(0,0,0,0.62)] ring-1 ring-black/5 dark:ring-white/10">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                Access
              </span>
              <span className="h-1.5 w-12 rounded-full bg-black/18 dark:bg-white/18" />
            </div>
            <div className="relative w-full aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-black shadow-[0_20px_44px_-32px_rgba(0,0,0,0.72)] flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(94,234,212,0.3),transparent_38%),linear-gradient(145deg,#0b1513,#050606)]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-white/12 backdrop-blur-md">
                <Mail size={30} />
              </div>
              <div className="relative mt-5 text-xl font-black">Magic Link</div>
              <p className="relative mt-2 max-w-[12rem] text-xs leading-relaxed text-white/65">
                Open the email link to sign in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery-caption order-2 rounded-[2rem] p-5 md:order-none md:col-start-2 md:-mt-48 lg:-mt-56">
        <Suspense>
          <LoginForm locale="en" />
        </Suspense>
      </section>
    </div>
  )
}
