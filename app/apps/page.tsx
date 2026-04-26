import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

type AppInfo = { url: string; icon: string; trackName: string }
type PopularApp = { name: string; use_count: number; info: AppInfo | null }

export const revalidate = 0

function extractTrackId(url: string): string | null {
  const m = url.match(/\/id(\d+)/)
  return m?.[1] ?? null
}

export default async function AppsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.rpc('popular_apps', { limit_count: 60 })
  const apps: PopularApp[] = data ?? []

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">人気のアプリ</h1>
        <p className="text-sm text-muted">投稿で多く使われているアプリ順</p>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20 text-muted">まだデータがありません</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {apps.map((app, i) => {
            const slug = app.info ? (extractTrackId(app.info.url) ?? app.info.trackName) : app.name
            const display = app.info?.trackName ?? app.name
            const rankColor = i < 3 ? 'text-amber-500 font-bold' : 'text-muted'
            return (
              <li key={app.name}>
                <Link
                  href={`/apps/${encodeURIComponent(slug)}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl glass hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  <span className={`text-sm w-6 text-center ${rankColor}`}>{i + 1}</span>
                  {app.info?.icon ? (
                    <Image
                      src={app.info.icon}
                      alt={display}
                      width={48}
                      height={48}
                      className="rounded-xl flex-shrink-0 shadow-md ring-1 ring-black/5"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center text-xs text-muted">?</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{display}</div>
                    <div className="text-xs text-muted">{app.use_count}件の投稿</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
