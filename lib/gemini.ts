import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export type ExtractedTags = {
  is_home_screen: boolean
  is_lock_screen?: boolean
  screen_type?: 'home' | 'lock' | 'other'
  apps: string[]
  widgets: string[]
  wallpaper_colors: string[]
  theme: 'dark' | 'light' | ''
  dock_apps: string[]
}

const PROMPT = `Analyze this image and return JSON only, no explanation.
Format: {"screen_type":"home"|"lock"|"other","is_home_screen":true|false,"is_lock_screen":true|false,"apps":["AppName",...],"widgets":["WidgetName",...],"wallpaper_colors":["#hex",...],"theme":"dark"|"light","dock_apps":["AppName",...]}

- screen_type: "home" for an iOS home screen screenshot, "lock" for an iOS lock screen screenshot, "other" for anything else.
- is_home_screen: true ONLY if this is an iOS home screen screenshot (showing app grid icons, optionally with widgets, status bar at top, dock at bottom).
- is_lock_screen: true ONLY if this is an iOS lock screen screenshot (showing time/date, lock screen widgets, wallpaper, notifications area, or unlock affordance). Do not mark photos, app screenshots, settings, web pages, or Control Center as lock screens.
- apps: top-level app icons on home screen ONLY. EXCLUDE apps shown inside folder previews (mini icons in folder thumbnails). Folder itself is not an app — skip folders entirely.
- widgets: widget types visible on home or lock screen (e.g. "Weather", "Calendar", "Battery")
- wallpaper_colors: 2-3 dominant hex colors from wallpaper
- theme: overall dark or light
- dock_apps: top-level apps in bottom dock ONLY. EXCLUDE apps inside folders.

If screen_type is "lock", return empty arrays for apps and dock_apps, but include visible lock screen widgets if present.
If screen_type is "other", return empty arrays for apps/widgets/dock_apps/wallpaper_colors and empty string for theme.`

export async function analyzeScreenshotFromBase64(
  base64: string,
  mimeType: string,
): Promise<ExtractedTags> {
  const result = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
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
