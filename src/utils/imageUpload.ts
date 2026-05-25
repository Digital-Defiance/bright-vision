const IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'application/pdf',
])

const IMAGE_EXT = /\.(png|jpe?g|gif|bmp|webp|tiff?|pdf)$/i

export function isAttachableImageFile(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type)) return true
  return IMAGE_EXT.test(file.name)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function filesToUploadParts(
  files: FileList | File[]
): Promise<{ filename: string; content_base64: string }[]> {
  const list = Array.from(files)
  const parts: { filename: string; content_base64: string }[] = []
  for (const file of list) {
    if (!isAttachableImageFile(file)) continue
    const content_base64 = await readFileAsDataUrl(file)
    parts.push({ filename: file.name, content_base64 })
  }
  return parts
}
