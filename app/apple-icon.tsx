import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: 100,
            height: 100,
          }}
        >
          {Array.from({ length: 3 }).map((_, row) => (
            <div key={row} style={{ display: 'flex', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, col) => (
                <div
                  key={col}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
