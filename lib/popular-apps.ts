import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractTrackId, lookupAppByTrackId } from '@/lib/app-store'

export type AppInfo = { url: string; icon: string; trackName: string }
export type PopularApp = { name: string; use_count: number; info: AppInfo | null }

export const getPopularApps = unstable_cache(
  async (limit: number): Promise<PopularApp[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase.rpc('popular_apps', { limit_count: limit })
    return (data as PopularApp[]) ?? []
  },
  ['popular_apps'],
  { revalidate: 60, tags: ['popular_apps'] },
)

async function lookupEnglishApp(trackId: string) {
  const item = (await lookupAppByTrackId(trackId, 'us')) ?? (await lookupAppByTrackId(trackId, 'jp'))
  if (!item) return null

  return {
    icon: item.artworkUrl100,
    trackName: item.trackName,
    url: item.trackViewUrl,
  }
}

// Cache the resolved English popular app information to prevent redundant API queries
export const getCachedPopularAppsEn = unstable_cache(
  async (limit: number) => {
    const rawPopularApps = await getPopularApps(limit)
    return Promise.all(
      rawPopularApps.map(async (app) => {
        const trackId = app.info ? extractTrackId(app.info.url) : null
        const englishInfo = trackId ? await lookupEnglishApp(trackId) : null
        return {
          ...app,
          info: englishInfo ?? app.info,
        }
      })
    )
  },
  ['english-popular-apps'],
  { revalidate: 60, tags: ['popular_apps'] }
)

