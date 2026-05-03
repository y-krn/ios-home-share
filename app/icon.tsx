import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #f7f4ed 0%, #dfe7e2 100%)',
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: 17,
            height: 23,
            padding: '4px 3px 3px',
            borderRadius: 5,
            background: '#090b0a',
            boxShadow: '0 2px 5px rgba(23,33,29,0.32)',
          }}
        >
          <div style={{ width: 7, height: 2, borderRadius: 999, background: '#1d2b26' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 3 }).map((_, col) => (
                  <div
                    key={col}
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1,
                      background: row === 2 && col === 1 ? '#5eead4' : '#edf3ee',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 'auto' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1,
                  background: i === 1 ? '#5eead4' : '#edf3ee',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
