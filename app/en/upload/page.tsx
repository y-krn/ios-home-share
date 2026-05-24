import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AlertTriangle, Folder, Mail, ScanLine } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { LoginForm } from '@/components/LoginForm'
import { UploadForm } from '@/components/UploadForm'
import { getAuthenticatedUser } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Share your iPhone setup — iSetup',
  description: 'Upload an iPhone home screen or lock screen screenshot and turn it into a setup profile with apps and widgets detected.',
  alternates: {
    canonical: '/en/upload',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function EnglishUploadPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-4">
        <BackButton fallback="/en" variant="text" label="Back" />
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
            <ScanLine size={13} />
            Upload Scanner
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">Share your iPhone setup</h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed">
            Choose a home screen or lock screen screenshot. iSetup detects apps,
            widgets, colors, and theme, then adds it to the setup gallery.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={17} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">Personal info is automatically masked by AI. </span>
              <span className="text-muted">Notification badges and private widgets are auto-detected, but please double-check the preview before publishing.</span>
            </p>
          </div>
        </div>
        <div className="gallery-caption rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <Folder size={17} className="text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">Apps inside Home Screen folders are not detected. </span>
              <span className="text-muted">Move apps you want tagged outside folders before taking the screenshot.</span>
            </p>
          </div>
        </div>
      </div>

      {user ? (
        <UploadForm locale="en" />
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(260px,0.9fr)_minmax(0,1fr)] md:items-start">
          <div className="gallery-shelf rounded-[2.25rem] p-5">
            <div className="phone-frame mx-auto aspect-[9/19.5] max-w-[18rem] overflow-hidden rounded-[2.85rem] p-[9px]">
              <div className="flex h-full flex-col items-center justify-center overflow-hidden rounded-[2.32rem] bg-black/90 p-6 text-center text-white [clip-path:inset(0_round_2.32rem)]">
                <Mail size={34} />
                <div className="mt-4 text-lg font-black">Login required</div>
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  Use a magic link to share and manage your setup.
                </p>
              </div>
            </div>
          </div>
          <div className="gallery-caption rounded-[2rem] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={17} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <span className="font-semibold">Email login is required to post. </span>
                <span className="text-muted">Open the link we send and you will return to this page.</span>
              </p>
            </div>
            <Suspense>
              <LoginForm nextOverride="/en/upload" locale="en" />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
