import type { Point, Quad } from './types'

/** решаем систему 8×8 методом Гаусса */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length
  const m = a.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = m[r][col] / m[col][col]
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c]
    }
  }
  return m.map((row, i) => row[n] / row[i])
}

/** матрица перспективы, которая переводит точки from в точки to */
export function homography(from: Quad, to: Quad): number[] {
  const a: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i]
    const { x: u, y: v } = to[i]
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  return [...solve(a, b), 1]
}

export function apply(h: number[], p: Point): Point {
  const w = h[6] * p.x + h[7] * p.y + h[8]
  return { x: (h[0] * p.x + h[1] * p.y + h[2]) / w, y: (h[3] * p.x + h[4] * p.y + h[5]) / w }
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** размер выпрямленного листа по длинам сторон */
export function outputSize(q: Quad, maxSide: number): { w: number; h: number } {
  const w = Math.max(dist(q[0], q[1]), dist(q[3], q[2]))
  const h = Math.max(dist(q[0], q[3]), dist(q[1], q[2]))
  const k = Math.min(1, maxSide / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) }
}

/** углы по умолчанию — чуть внутрь от краёв кадра */
export function defaultQuad(w: number, h: number, inset = 0.04): Quad {
  const dx = w * inset
  const dy = h * inset
  return [
    { x: dx, y: dy },
    { x: w - dx, y: dy },
    { x: w - dx, y: h - dy },
    { x: dx, y: h - dy },
  ]
}

export function fullQuad(w: number, h: number): Quad {
  return defaultQuad(w, h, 0)
}
