import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export type ExtractedTags = {
  is_home_screen: boolean
  apps: string[]
  widgets: string[]
  wallpaper_colors: string[]
  theme: 'dark' | 'light'
  dock_apps: string[]
}

const PROMPT = `Analyze this image and return JSON only, no explanation.
Format: {"is_home_screen":true|false,"apps":["AppName",...],"widgets":["WidgetName",...],"wallpaper_colors":["#hex",...],"theme":"dark"|"light","dock_apps":["AppName",...]}

- is_home_screen: true ONLY if this is an iOS home screen screenshot (showing app grid icons, optionally with widgets, status bar at top, dock at bottom). false for: photos, app screenshots, lock screen, settings, web pages, anything else. Be strict.
- apps: top-level app icons on home screen ONLY. EXCLUDE apps shown inside folder previews (mini icons in folder thumbnails). Folder itself is not an app — skip folders entirely.
- widgets: widget types visible (e.g. "Weather", "Calendar")
- wallpaper_colors: 2-3 dominant hex colors from wallpaper
- theme: overall dark or light
- dock_apps: top-level apps in bottom dock ONLY. EXCLUDE apps inside folders.

If is_home_screen is false, return empty arrays for apps/widgets/dock_apps and empty string for theme.`

export async function analyzeScreenshotFromBase64(
  base64: string,
  mimeType: string,
): Promise<ExtractedTags> {
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: PROMPT },
        ],
      },
    ],
  })

  const text = result.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')

  return JSON.parse(jsonMatch[0]) as ExtractedTags
}

export async function analyzeScreenshot(imageUrl: string): Promise<ExtractedTags> {
  const res = await fetch(imageUrl)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = res.headers.get('content-type') ?? 'image/png'
  return analyzeScreenshotFromBase64(base64, mimeType)
}
