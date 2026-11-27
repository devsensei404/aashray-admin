const MAX_SIDE = 2560
const TARGET_BYTES = 3 * 1024 * 1024
const QUALITIES = [0.9, 0.85, 0.8, 0.75]
const ROUNDS = 3
const SHRINK = 0.85

export async function looksLikeJpegOrPng(file) {
  const h = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const jpeg = h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff
  const png = h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47
  return jpeg || png
}

async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(file)
  }
}

function toBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', quality)
  })
}

function asFile(blob, original) {
  const base = original.name.replace(/\.[^.]+$/, '') || 'photo'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

export async function compressImage(file) {
  const bitmap = await decode(file)
  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    if (file.size <= TARGET_BYTES && longest <= MAX_SIDE) return file

    let scale = Math.min(1, MAX_SIDE / longest)
    let best = null

    for (let round = 0; round < ROUNDS; round++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      for (const q of QUALITIES) {
        const blob = await toBlob(canvas, q)
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= TARGET_BYTES) return best.size >= file.size ? file : asFile(best, file)
      }
      scale *= SHRINK
    }

    return best.size >= file.size ? file : asFile(best, file)
  } finally {
    bitmap.close()
  }
}
