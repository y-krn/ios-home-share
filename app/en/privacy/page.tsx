import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { BackButton } from '@/components/BackButton'

export const metadata: Metadata = {
  title: 'Privacy Policy — iSetup.app',
  alternates: {
    canonical: '/en/privacy',
  },
}

export default function EnglishPrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <BackButton fallback="/en" variant="text" label="Back" />
        <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
          <ShieldCheck size={13} />
          Privacy Note
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">Privacy Policy</h1>
          <p className="text-xs font-semibold text-muted">Last updated: May 9, 2026</p>
        </div>
      </header>

      <div className="gallery-shelf rounded-[2.25rem] p-4 sm:p-6 space-y-4">
        <Section title="1. Information We Process">
          <ul className="list-disc pl-6 space-y-1">
            <li>Email address for magic link authentication.</li>
            <li>Uploaded screenshot images and compressed public images.</li>
            <li>Automatically extracted setup details such as apps, widgets, theme, colors, and screen type.</li>
            <li>Likes, edits, deletes, access logs, and usage analytics.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Information">
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide public setup posts, authentication, editing, and deletion features.</li>
            <li>To analyze screenshots and generate setup tags.</li>
            <li>To fetch and display App Store app metadata.</li>
            <li>To prevent abuse and improve the service.</li>
          </ul>
        </Section>

        <Section title="3. Third-Party Services">
          <p>iSetup.app uses third-party services to operate the product:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> for database, authentication, and screenshot storage.</li>
            <li><strong>Google Gemini API</strong> for screenshot analysis.</li>
            <li><strong>Apple iTunes Search API</strong> for app metadata.</li>
            <li><strong>Resend</strong> for magic link email delivery.</li>
            <li><strong>Vercel</strong> for hosting, access logs, and Web Analytics.</li>
          </ul>
        </Section>

        <Section title="4. Screenshot Uploads">
          <p>
            Do not upload screenshots that contain personal information, private notifications, messages, contacts,
            location, photos, financial or health information, or content you do not have permission to share.
          </p>
          <p>
            During upload, the original file may be temporarily stored for processing. After processing succeeds, iSetup
            stores a compressed public version and attempts to delete the temporary upload.
          </p>
        </Section>

        <Section title="5. AI Processing">
          <p>
            Uploaded images are sent to Google Gemini API to extract setup information. Google processes this data
            according to its applicable API terms and privacy policies. Automated results may be inaccurate.
          </p>
        </Section>

        <Section title="6. Your Choices">
          <p>
            You can view, edit, and delete your own posts from your account area. For account deletion or removal
            requests, contact{' '}
            <a href="mailto:contact@isetup.app" className="text-accent hover:underline">contact@isetup.app</a>.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>iSetup.app uses cookies for authentication sessions. Login features may not work if cookies are disabled.</p>
        </Section>

        <Section title="8. EU/EEA and UK Privacy Rights (GDPR)">
          <p>
            Under the EU General Data Protection Regulation (GDPR) and UK GDPR, users in the European Economic Area (EEA) and the United Kingdom have the rights to access, rectify, or erase their personal data, restrict or object to its processing, request data portability, and withdraw consent at any time.
          </p>
          <p>
            To exercise any of these rights, please email us at <a href="mailto:contact@isetup.app" className="text-accent hover:underline">contact@isetup.app</a>.
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

