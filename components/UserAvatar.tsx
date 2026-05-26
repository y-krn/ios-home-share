import { User } from 'lucide-react'

type Props = {
  userId: string
  size?: number
  className?: string
}

function getDeterministicGradient(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 60) % 360
  // Harmonious gradient colors using tailored HSL values
  return `linear-gradient(135deg, hsl(${h1}, 70%, 55%), hsl(${h2}, 80%, 40%))`
}

export function UserAvatar({ userId, size = 32, className = '' }: Props) {
  const gradient = getDeterministicGradient(userId)
  const iconSize = Math.floor(size * 0.5)

  return (
    <div
      className={`relative flex items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-2 ring-white/10 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: gradient,
      }}
      title={`User ${userId.slice(0, 4)}`}
    >
      <User size={iconSize} className="text-white/80" />
    </div>
  )
}
