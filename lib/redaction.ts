import sharp from 'sharp'
import { type BoundingBox } from './gemini'

export async function applyRedaction(
  imageBuffer: Buffer,
  boxes: BoundingBox[]
): Promise<Buffer> {
  if (!boxes || boxes.length === 0) return imageBuffer

  try {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width ?? 1080
    const height = metadata.height ?? 1920

    const solidBoxes = boxes.filter(b => b.label === 'notification_badge')
    const blurBoxes = boxes.filter(b => b.label === 'sensitive_text')

    let currentBuffer = imageBuffer

    // 1. Apply solid blackout to notification_badge
    if (solidBoxes.length > 0) {
      const svgRects = solidBoxes.map((box) => {
        const x = (box.xmin / 1000) * width
        const y = (box.ymin / 1000) * height
        const w = ((box.xmax - box.xmin) / 1000) * width
        const h = ((box.ymax - box.ymin) / 1000) * height

        let rx = 10
        let ry = 10
        if (box.label === 'notification_badge') {
          rx = Math.min(w, h) / 2
          ry = Math.min(w, h) / 2
        }

        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${ry}" fill="black" />`
      })

      const svgOverlay = `<svg width="${width}" height="${height}">${svgRects.join('')}</svg>`
      currentBuffer = await sharp(currentBuffer)
        .composite([{ input: Buffer.from(svgOverlay), blend: 'over' }])
        .toBuffer()
    }

    // 2. Apply gaussian blur overlay to sensitive_text blocks
    if (blurBoxes.length > 0) {
      const blurredImage = await sharp(currentBuffer).blur(20).toBuffer()

      const svgRects = blurBoxes.map((box) => {
        const x = (box.xmin / 1000) * width
        const y = (box.ymin / 1000) * height
        const w = ((box.xmax - box.xmin) / 1000) * width
        const h = ((box.ymax - box.ymin) / 1000) * height
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="black" />`
      })

      const svgMask = `<svg width="${width}" height="${height}">${svgRects.join('')}</svg>`

      const maskedBlur = await sharp(blurredImage)
        .composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }])
        .toBuffer()

      const maskedOriginal = await sharp(currentBuffer)
        .composite([{ input: Buffer.from(svgMask), blend: 'dest-out' }])
        .toBuffer()

      currentBuffer = await sharp(maskedOriginal)
        .composite([{ input: maskedBlur, blend: 'over' }])
        .toBuffer()
    }

    return currentBuffer
  } catch (e) {
    console.error('Redaction failed, proceeding with original buffer:', e)
    return imageBuffer
  }
}
