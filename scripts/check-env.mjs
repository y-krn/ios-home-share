import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_API_KEY',
]

const envFiles = ['.env.local', '.env.development.local', '.env.production.local', '.env']

function parseEnvFile(path) {
  if (!existsSync(path)) return {}

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        if (index === -1) return null

        const key = line.slice(0, index).trim()
        const rawValue = line.slice(index + 1).trim()
        const value = rawValue.replace(/^(['"])(.*)\1$/, '$2')
        return [key, value]
      })
      .filter(Boolean),
  )
}

const fileEnv = envFiles.reduce(
  (merged, file) => ({ ...merged, ...parseEnvFile(resolve(process.cwd(), file)) }),
  {},
)

const missing = required.filter((key) => !(process.env[key] || fileEnv[key]))

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('Environment variables OK')
