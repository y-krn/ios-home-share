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
          background: 'linear-gradient(145deg, #f7f4ed 0%, #eef1ee 48%, #dfe7e2 100%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 132,
            height: 132,
            borderRadius: 32,
            background: 'rgba(255,252,245,0.72)',
            border: '1px solid rgba(31,36,33,0.1)',
            boxShadow: '0 18px 44px rgba(23,33,29,0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 72,
              height: 110,
              padding: '13px 10px 10px',
              borderRadius: 24,
              background: 'linear-gradient(180deg, #171a18 0%, #050606 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.09), 0 18px 36px rgba(0,0,0,0.32)',
            }}
          >
            <div style={{ width: 26, height: 5, borderRadius: 999, background: '#1d2b26' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
              {Array.from({ length: 4 }).map((_, row) => (
                <div key={row} style={{ display: 'flex', gap: 7 }}>
                  {Array.from({ length: 3 }).map((_, col) => (
                    <div
                      key={col}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        background: row === 1 && col === 2 ? '#5eead4' : '#edf3ee',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.22)',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 7,
                marginTop: 'auto',
                padding: 7,
                borderRadius: 15,
                background: 'rgba(255,255,255,0.13)',
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: i === 1 ? '#5eead4' : '#edf3ee',
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              width: 42,
              height: 42,
              right: 12,
              bottom: 12,
              borderRadius: 14,
              background: '#0f766e',
              boxShadow: '0 10px 22px rgba(15,118,110,0.28)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 25,
              bottom: 25,
              width: 16,
              height: 16,
              borderRadius: 6,
              background: '#99f6e4',
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
