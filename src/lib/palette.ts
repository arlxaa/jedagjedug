import type { Palette } from '../types.ts'

/** Clubby purple/magenta palette — moody, not bright-neon. */
export const NEON_PALETTE: Palette = {
  bg: '#0f0820',
  colors: ['#e4388f', '#a855f7', '#ff8ada', '#7c3aed'],
}

/**
 * Extract four dominant-ish colors from an album cover.
 * Samples a tiny offscreen canvas, buckets pixels into a coarse color grid,
 * and returns the four most frequent, vivid buckets. Falls back to neon.
 *
 * Requires the image to be CORS-friendly (Spotify covers are served with CORS).
 */
export async function extractPalette(imageUrl: string): Promise<Palette> {
  try {
    const img = await loadImage(imageUrl)
    const size = 48
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return NEON_PALETTE
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)

    const buckets = new Map<string, { count: number; r: number; g: number; b: number; vivid: number }>()
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a < 128) continue
      // Skip near-black / near-white so lights stay colorful.
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      if (max < 40 || min > 215) continue
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`
      const vivid = (max - min) + max * 0.25
      const e = buckets.get(key)
      if (e) {
        e.count++
        e.r += r
        e.g += g
        e.b += b
        e.vivid = Math.max(e.vivid, vivid)
      } else {
        buckets.set(key, { count: 1, r, g, b, vivid })
      }
    }

    const sorted = [...buckets.values()]
      .sort((a, b) => b.count * b.vivid - a.count * a.vivid)
      .slice(0, 4)
      .map((e) => rgbToHex(e.r / e.count, e.g / e.count, e.b / e.count))

    if (sorted.length < 2) return NEON_PALETTE

    // Pad to exactly four colors by cycling.
    while (sorted.length < 4) sorted.push(sorted[sorted.length % sorted.length === 0 ? 0 : sorted.length - 1])
    const colors = sorted.slice(0, 4) as [string, string, string, string]
    return { bg: '#0c0718', colors }
  } catch {
    return NEON_PALETTE
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Pick a palette color by index (wraps). */
export function pick(p: Palette, i: number): string {
  return p.colors[((i % 4) + 4) % 4]
}
