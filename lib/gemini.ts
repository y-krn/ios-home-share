import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export type BoundingBox = {
  ymin: number
  xmin: number
  ymax: number
  xmax: number
  label: 'notification_badge' | 'sensitive_text'
}

export type ExtractedTags = {
  is_home_screen: boolean
  is_lock_screen?: boolean
  screen_type?: 'home' | 'lock' | 'other'
  apps: string[]
  widgets: string[]
  wallpaper_colors: string[]
  theme: 'dark' | 'light' | ''
  dock_apps: string[]
  redaction_boxes?: BoundingBox[]
}

const PROMPT = `Analyze this image and return JSON only, no explanation.
Format: {"screen_type":"home"|"lock"|"other","is_home_screen":true|false,"is_lock_screen":true|false,"apps":["AppName",...],"widgets":["WidgetName",...],"wallpaper_colors":["#hex",...],"theme":"dark"|"light","dock_apps":["AppName",...],"redaction_boxes":[{"ymin":number,"xmin":number,"ymax":number,"xmax":number,"label":"notification_badge"|"sensitive_text"},...]}

- screen_type: "home" for an iOS home screen screenshot, "lock" for an iOS lock screen screenshot, "other" for anything else.
- is_home_screen: true ONLY if this is an iOS home screen screenshot (showing app grid icons, optionally with widgets, status bar at top, dock at bottom).
- is_lock_screen: true ONLY if this is an iOS lock screen screenshot (showing time/date, lock screen widgets, wallpaper, notifications area, or unlock affordance). Do not mark photos, app screenshots, settings, web pages, or Control Center as lock screens.
- apps: top-level app icons on home screen ONLY. EXCLUDE apps shown inside folder previews (mini icons in folder thumbnails). Folder itself is not an app — skip folders entirely.
- widgets: widget types visible on home or lock screen (e.g. "Weather", "Calendar", "Battery")
- wallpaper_colors: 2-3 dominant hex colors from wallpaper
- theme: overall dark or light
- dock_apps: top-level apps in bottom dock ONLY. EXCLUDE apps inside folders.
- redaction_boxes: list of up to 10 sensitive bounding boxes to redact for privacy. Normalized to [ymin, xmin, ymax, xmax] range from 0 to 1000.
  - "notification_badge": Small red circular badges showing notification counts on apps.
  - "sensitive_text": Extremely tight bounding boxes of ONLY the specific sensitive text strings inside widgets, notifications, or screens.
    - Weather or Maps widgets: ONLY select the city, location, ward, town, or district name text itself (e.g., "New York", "London", "Tokyo", "板橋区", "港区", "横浜市"). DO NOT include temperatures (e.g., "72°", "20°C", "15°C"), GPS/arrow icons (e.g., "↗"), weather condition text (e.g., "Partly Cloudy", "Sunny", "明日は気温が上昇し..."), or weather icons.
    - Calendar or Reminders widgets: ONLY select the event titles or notes text itself (including Japanese text). DO NOT select date headers, day of week (e.g., "土", "23"), or calendar icons.
    - Messages or Mail widgets: ONLY select message snippets, sender names, or subject lines.
    - The bounding boxes must be extremely tight around the target characters to prevent the blur effect from bleeding into adjacent non-sensitive details like temperatures, icons, and layout lines.
  - Return an empty array [] if none are found.

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
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          screen_type: {
            type: Type.STRING,
            enum: ['home', 'lock', 'other']
          },
          is_home_screen: { type: Type.BOOLEAN },
          is_lock_screen: { type: Type.BOOLEAN },
          apps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          widgets: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          wallpaper_colors: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          theme: {
            type: Type.STRING,
            enum: ['dark', 'light', '']
          },
          dock_apps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          redaction_boxes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER },
                label: {
                  type: Type.STRING,
                  enum: ['notification_badge', 'sensitive_text']
                }
              },
              required: ['ymin', 'xmin', 'ymax', 'xmax', 'label']
            }
          }
        },
        required: [
          'screen_type',
          'is_home_screen',
          'is_lock_screen',
          'apps',
          'widgets',
          'wallpaper_colors',
          'theme',
          'dock_apps'
        ]
      }
    }
  })

  const text = result.text ?? ''
  if (!text) throw new Error('Empty response from AI')
  return JSON.parse(text) as ExtractedTags
}
