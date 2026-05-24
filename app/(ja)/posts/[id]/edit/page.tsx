import { notFound, redirect } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { EditTagsForm } from '@/components/EditTagsForm'

type Props = { params: Promise<{ id: string }> }
type Locale = 'ja' | 'en'

const copy = {
  ja: {
    loginPrefix: '/login?next=',
    postPrefix: '/posts',
    heading: 'タグを編集',
    description: 'AIが読み取ったアプリ、Dock、ウィジェット、テーマを手直しできます。',
    backLabel: undefined,
  },
  en: {
    loginPrefix: '/en/login?next=',
    postPrefix: '/en/posts',
    heading: 'Edit setup tags',
    description: 'Adjust the apps, Dock, widgets, and theme detected by AI.',
    backLabel: 'Back',
  },
} satisfies Record<Locale, {
  loginPrefix: string
  postPrefix: string
  heading: string
  description: string
  backLabel?: string
}>

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function EditPostPage({ params }: Props) {
  return <EditPostContent params={params} locale="ja" />
}

export async function EditPostContent({ params, locale }: Props & { locale: Locale }) {
  const { id } = await params
  const t = copy[locale]
  const postPath = `${t.postPrefix}/${id}`
  const editPath = `${postPath}/edit`
  const user = await getAuthenticatedUser()
  if (!user) redirect(`${t.loginPrefix}${encodeURIComponent(editPath)}`)
  const supabase = createAdminClient()
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()
  if (!post) notFound()

  const tags = post.extracted_tags ?? {}
  const screenType = tags.screen_type === 'lock' || tags.is_lock_screen ? 'lock' : 'home'

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackButton fallback={postPath} variant="text" label={t.backLabel} />
        <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-accent uppercase">
          <SlidersHorizontal size={13} />
          Setup Editor
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">{t.heading}</h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed">
            {t.description}
          </p>
        </div>
      </div>

      <EditTagsForm
        postId={id}
        ownerAnonId={post.anon_user_id}
        imageUrl={post.image_url}
        screenType={screenType}
        initialApps={tags.apps ?? []}
        initialDockApps={tags.dock_apps ?? []}
        initialWidgets={tags.widgets ?? []}
        initialTheme={tags.theme ?? ''}
        appLinks={tags.app_links ?? {}}
        widgetLinks={tags.widget_links ?? {}}
        locale={locale}
      />
    </div>
  )
}
