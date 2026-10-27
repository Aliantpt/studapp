import { homography, outputSize } from './geometry'
import type { Filter, Quad } from './types'

const WORK_SIDE = 2400
const PAGE_SIDE = 1800

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function ctx2d(c: HTMLCanvasElement) {
  return c.getContext('2d', { willReadFrequently: true })!
}

/** фото → canvas, сразу уменьшаем, чтобы телефон не захлебнулся */
export async function loadImage(file: Blob): Promise<HTMLCanvasElement> {
  let source: ImageBitmap | HTMLImageElement
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }
  const k = Math.min(1, WORK_SIDE / Math.max(source.width, source.height))
  const c = canvas(Math.round(source.width * k), Math.round(source.height * k))
  ctx2d(c).drawImage(source, 0, 0, c.width, c.height)
  if ('close' in source) source.close()
  return c
}

/** поворот на 90° по часовой */
export function rotate(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = canvas(src.height, src.width)
  const g = ctx2d(c)
  g.translate(c.width, 0)
  g.rotate(Math.PI / 2)
  g.drawImage(src, 0, 0)
  return c
}

/** вырезаем лист по четырём углам и выпрямляем перспективу */
export function warp(src: HTMLCanvasElement, quad: Quad): HTMLCanvasElement {
  const { w, h } = outputSize(quad, PAGE_SIDE)
  const dst = canvas(w, h)
  // для каждого пикселя результата ищем, откуда брать цвет в исходнике
  const m = homography(
    [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
    quad,
  )
  const sw = src.width
  const sh = src.height
  const s = ctx2d(src).getImageData(0, 0, sw, sh).data
  const out = ctx2d(dst).createImageData(w, h)
  const o = out.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const den = m[6] * x + m[7] * y + m[8]
      const fx = (m[0] * x + m[1] * y + m[2]) / den
      const fy = (m[3] * x + m[4] * y + m[5]) / den
      const x0 = Math.max(0, Math.min(sw - 2, Math.floor(fx)))
      const y0 = Math.max(0, Math.min(sh - 2, Math.floor(fy)))
      const ax = Math.max(0, Math.min(1, fx - x0))
      const ay = Math.max(0, Math.min(1, fy - y0))
      const i00 = (y0 * sw + x0) * 4
      const i10 = i00 + 4
      const i01 = i00 + sw * 4
      const i11 = i01 + 4
      const di = (y * w + x) * 4
      for (let ch = 0; ch < 3; ch++) {
        const top = s[i00 + ch] + (s[i10 + ch] - s[i00 + ch]) * ax
        const bot = s[i01 + ch] + (s[i11 + ch] - s[i01 + ch]) * ax
        o[di + ch] = top + (bot - top) * ay
      }
      o[di + 3] = 255
    }
  }
  ctx2d(dst).putImageData(out, 0, 0)
  return dst
}

/** сглаженная «подложка» листа: уменьшаем, размываем, растягиваем обратно */
function background(src: HTMLCanvasElement): Uint8ClampedArray {
  const small = canvas(Math.max(1, Math.round(src.width / 16)), Math.max(1, Math.round(src.height / 16)))
  const g = ctx2d(small)
  g.filter = 'blur(2px)'
  g.drawImage(src, 0, 0, small.width, small.height)
  const big = canvas(src.width, src.height)
  const bg = ctx2d(big)
  bg.imageSmoothingQuality = 'high'
  bg.drawImage(small, 0, 0, big.width, big.height)
  return bg.getImageData(0, 0, big.width, big.height).data
}

export function applyFilter(src: HTMLCanvasElement, filter: Filter): HTMLCanvasElement {
  if (filter === 'original') return src
  const dst = canvas(src.width, src.height)
  const g = ctx2d(dst)
  g.drawImage(src, 0, 0)
  const img = g.getImageData(0, 0, dst.width, dst.height)
  const d = img.data

  if (filter === 'color') {
    // чуть ярче и контрастнее, бумага светлеет
    for (let i = 0; i < d.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) d[i + ch] = (d[i + ch] - 128) * 1.12 + 136
    }
  } else {
    // документ: делим на подложку, чтобы убрать тени, и поднимаем контраст
    const bg = background(src)
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const base = 0.299 * bg[i] + 0.587 * bg[i + 1] + 0.114 * bg[i + 2]
      const norm = Math.min(255, (gray / Math.max(base, 1)) * 255)
      const v = (norm - 90) * 1.6
      d[i] = d[i + 1] = d[i + 2] = v
    }
  }
  g.putImageData(img, 0, 0)
  return dst
}

export function toJpeg(c: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
  )
}

export function thumbnail(c: HTMLCanvasElement, side = 360): Promise<Blob> {
  const k = Math.min(1, side / Math.max(c.width, c.height))
  const t = canvas(Math.round(c.width * k), Math.round(c.height * k))
  ctx2d(t).drawImage(c, 0, 0, t.width, t.height)
  return toJpeg(t, 0.75)
}

/** размер картинки в пикселях, нужен для PDF */
export async function imageSize(blob: Blob): Promise<{ w: number; h: number }> {
  const bmp = await createImageBitmap(blob)
  const size = { w: bmp.width, h: bmp.height }
  bmp.close()
  return size
}
