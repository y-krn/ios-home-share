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
          background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: 18,
            height: 18,
          }}
        >
          {Array.from({ length: 3 }).map((_, row) => (
            <div key={row} style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 3 }).map((_, col) => (
                <div
                  key={col}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 1,
                    background: 'white',
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
