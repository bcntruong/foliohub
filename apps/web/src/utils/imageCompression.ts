export interface ImageCompressionOptions {
  maxDimension: number
  targetBytes: number
  outputType: 'image/webp'
  qualityLevels: readonly number[]
}

export const AVATAR_COMPRESSION_OPTIONS: ImageCompressionOptions = {
  maxDimension: 512,
  targetBytes: 200 * 1024,
  outputType: 'image/webp',
  qualityLevels: [0.86, 0.8, 0.74, 0.68],
}

export function containedImageSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function outputName(fileName: string) {
  return `${fileName.replace(/\.[^.]+$/, '')}.webp`
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function compressImage(file: File, options: ImageCompressionOptions) {
  const bitmap = await createImageBitmap(file)
  try {
    const size = containedImageSize(bitmap.width, bitmap.height, options.maxDimension)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, size.width, size.height)

    let smallestBlob: Blob | null = null
    for (const quality of options.qualityLevels) {
      const blob = await canvasBlob(canvas, options.outputType, quality)
      if (!blob) continue
      smallestBlob = !smallestBlob || blob.size < smallestBlob.size ? blob : smallestBlob
      if (blob.size <= options.targetBytes) {
        return blob.size < file.size
          ? new File([blob], outputName(file.name), { type: blob.type })
          : file
      }
    }

    return smallestBlob && smallestBlob.size < file.size
      ? new File([smallestBlob], outputName(file.name), { type: smallestBlob.type })
      : file
  } finally {
    bitmap.close()
  }
}
