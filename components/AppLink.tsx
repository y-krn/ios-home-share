import Image from 'next/image'
import Link from 'next/link'

type AppInfo = { url: string; icon: string; trackName: string }

type Props = { name: string; info?: AppInfo }

function extractTrackId(url: string): string | null {
  const m = url.match(/\/id(\d+)/)
  return m?.[1] ?? null
}

export function AppLink({ name, info }: Props) {
  const slug = info ? (extractTrackId(info.url) ?? info.trackName) : name

  return (
    <Link
      href={`/apps/${encodeURIComponent(slug)}`}
      className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full glass-soft text-xs font-medium hover:scale-105 active:scale-95 transition-transform"
    >
      {info ? (
        <Image
          src={info.icon}
          alt={info.trackName}
          width={22}
          height={22}
          className="rounded-md shadow-sm"
          unoptimized
        />
      ) : (
        <span className="w-[22px] h-[22px] rounded-md bg-white/30 flex items-center justify-center text-[8px] text-muted">?</span>
      )}
      <span>{info?.trackName ?? name}</span>
    </Link>
  )
}
