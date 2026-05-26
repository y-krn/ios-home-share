// iTunes Search API → App Store URL解決
// Doc: https://performance-partners.apple.com/search-api

export type AppStoreInfo = {
  url: string
  icon: string
  trackName: string
}

export type FullAppStoreInfo = {
  trackId: number
  trackName: string
  artistName: string
  trackViewUrl: string
  artworkUrl512?: string
  artworkUrl100: string
  description?: string
  averageUserRating?: number
  userRatingCount?: number
  genres?: string[]
  formattedPrice?: string
  screenshotUrls?: string[]
  primaryGenreName?: string
}

const ENDPOINT = 'https://itunes.apple.com/search'
const LOOKUP_ENDPOINT = 'https://itunes.apple.com/lookup'

type ITunesItem = {
  trackName: string
  artistName: string
  trackViewUrl: string
  artworkUrl100: string
  sellerName?: string
}

const APPLE_ARTISTS = ['Apple', 'Apple Inc.', 'Apple Inc']

export async function lookupApp(name: string, country = 'jp'): Promise<AppStoreInfo | null> {
  try {
    const params = new URLSearchParams({
      term: name,
      country,
      entity: 'software',
      limit: '5',
    })
    const res = await fetch(`${ENDPOINT}?${params}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const data = await res.json()
    const items: ITunesItem[] = data.results ?? []
    if (items.length === 0) return null

    // Apple純正アプリ優先 → 無ければ1位
    const appleApp = items.find(i =>
      APPLE_ARTISTS.includes(i.artistName) || (i.sellerName && APPLE_ARTISTS.includes(i.sellerName))
    )
    const item = appleApp ?? items[0]

    return {
      url: item.trackViewUrl,
      icon: item.artworkUrl100,
      trackName: item.trackName,
    }
  } catch {
    return null
  }
}

export async function lookupAppByTrackId(trackId: string, country = 'jp'): Promise<FullAppStoreInfo | null> {
  try {
    const params = new URLSearchParams({ id: trackId, country, entity: 'software' })
    const res = await fetch(`${LOOKUP_ENDPOINT}?${params}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const data = await res.json()
    return data.results?.[0] ?? null
  } catch {
    return null
  }
}

export async function lookupFullApp(slug: string, country = 'jp'): Promise<FullAppStoreInfo | null> {
  if (/^\d+$/.test(slug)) {
    return lookupAppByTrackId(slug, country)
  }

  try {
    const params = new URLSearchParams({ term: slug, country, entity: 'software', limit: '1' })
    const res = await fetch(`${ENDPOINT}?${params}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const data = await res.json()
    return data.results?.[0] ?? null
  } catch {
    return null
  }
}

export async function lookupApps(names: string[]): Promise<Record<string, AppStoreInfo>> {
  const results = await Promise.all(names.map(async n => [n, await lookupApp(n)] as const))
  return Object.fromEntries(results.filter(([, v]) => v !== null)) as Record<string, AppStoreInfo>
}

// trackViewUrl ("https://apps.apple.com/jp/app/foo/id12345") → "12345"
export function extractTrackId(url: string): string | null {
  const m = url.match(/\/id(\d+)/)
  return m?.[1] ?? null
}
