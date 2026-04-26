declare module 'exif-parser' {
  interface ExifResult {
    tags: Record<string, string | number | undefined>
    imageSize?: { width: number; height: number }
  }
  interface Parser {
    parse(): ExifResult
  }
  const ExifParser: {
    create(buffer: Buffer): Parser
  }
  export default ExifParser
}
