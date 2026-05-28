import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { lookupApps } from '@/lib/app-store'

const BUCKET = 'screenshots'

function extractTrackIds(appLinks?: Record<string, unknown>, widgetLinks?: Record<string, unknown>): string[] {
  const ids = new Set<string>()
  const extract = (links?: Record<string, unknown>) => {
    if (!links) return
    for (const key in links) {
      const obj = links[key]
      if (obj && typeof obj === 'object' && 'url' in obj) {
        const url = (obj as { url?: unknown }).url
        if (typeof url === 'string') {
          const match = url.match(/\/id(\d+)(?:\?|$|\/)/)
          if (match) {
            ids.add(match[1])
          }
        }
      }
    }
  }
  extract(appLinks)
  extract(widgetLinks)
  return Array.from(ids)
}

async function authenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatedUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { id } = await params
    const { apps, dock_apps, widgets, theme, app_links, widget_links } = await req.json()

    const admin = createAdminClient()

    const { data: post, error: fetchError } = await admin
      .from('posts')
      .select('anon_user_id, extracted_tags')
      .eq('id', id)
      .single()

    if (fetchError || !post) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (post.anon_user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const currentTags = (post.extracted_tags ?? {}) as Record<string, unknown>
    const currentAppLinks = (currentTags.app_links ?? {}) as Record<string, unknown>
    const currentWidgetLinks = (currentTags.widget_links ?? {}) as Record<string, unknown>

    const clientAppLinks = (app_links ?? {}) as Record<string, unknown>
    const clientWidgetLinks = (widget_links ?? {}) as Record<string, unknown>
    const baseAppLinks = { ...currentAppLinks, ...clientAppLinks }
    const baseWidgetLinks = { ...currentWidgetLinks, ...clientWidgetLinks }

    const cleanArr = (a: unknown) => (Array.isArray(a) ? a.map(String).map(s => s.trim()).filter(Boolean) : undefined)
    const newApps = cleanArr(apps)
    const newDockApps = cleanArr(dock_apps)
    const newWidgets = cleanArr(widgets)

    const allApps = [...(newApps ?? []), ...(newDockApps ?? [])]
    const unknownApps = allApps.filter(n => !(n in baseAppLinks))
    const fetchedAppLinks = unknownApps.length > 0 ? await lookupApps(unknownApps) : {}
    const mergedAppLinks: Record<string, unknown> = {}
    for (const name of new Set(allApps)) {
      const v = baseAppLinks[name] ?? fetchedAppLinks[name]
      if (v !== undefined) mergedAppLinks[name] = v
    }

    const unknownWidgets = (newWidgets ?? []).filter(n => !(n in baseWidgetLinks))
    const fetchedWidgetLinks = unknownWidgets.length > 0 ? await lookupApps(unknownWidgets) : {}
    const mergedWidgetLinks: Record<string, unknown> = {}
    for (const name of new Set(newWidgets ?? [])) {
      const v = baseWidgetLinks[name] ?? fetchedWidgetLinks[name]
      if (v !== undefined) mergedWidgetLinks[name] = v
    }

    const updated = {
      ...currentTags,
      ...(newApps !== undefined ? { apps: newApps } : {}),
      ...(newDockApps !== undefined ? { dock_apps: newDockApps } : {}),
      ...(newWidgets !== undefined ? { widgets: newWidgets } : {}),
      ...(theme !== undefined ? { theme } : {}),
      app_links: mergedAppLinks,
      widget_links: mergedWidgetLinks,
      track_ids: extractTrackIds(mergedAppLinks, mergedWidgetLinks),
    }

    const { error: updateError } = await admin
      .from('posts')
      .update({ extracted_tags: updated })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true, extracted_tags: updated })
  } catch (e) {
    console.error('patch error:', e)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatedUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { id } = await params
    const admin = createAdminClient()

    const { data: post, error: fetchError } = await admin
      .from('posts')
      .select('id, image_path, anon_user_id')
      .eq('id', id)
      .single()

    if (fetchError || !post) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (post.anon_user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await admin.storage.from(BUCKET).remove([post.image_path])

    const { error: deleteError } = await admin.from('posts').delete().eq('id', id)
    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('delete error:', e)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}
