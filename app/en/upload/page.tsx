import type { Metadata } from 'next'
import { AlertTriangle, Folder, ScanLine } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
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
              <span className="font-semibold">Review and edit privacy blurs before publishing. </span>
              <span className="text-muted">Check detected notifications, events, and private text in the preview, then add or adjust blurs as needed.</span>
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

      <UploadForm locale="en" isAuthenticated={!!user} />

    </div>
  )
}
