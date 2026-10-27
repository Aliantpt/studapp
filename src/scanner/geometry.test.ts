import { describe, expect, it } from 'vitest'
import { apply, defaultQuad, homography, outputSize } from './geometry'
import type { Quad } from './types'

describe('перспектива', () => {
  const rect: Quad = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 200 },
    { x: 0, y: 200 },
  ]
  const skewed: Quad = [
    { x: 30, y: 20 },
    { x: 380, y: 50 },
    { x: 400, y: 560 },
    { x: 10, y: 520 },
  ]

  it('углы переходят в углы', () => {
    const h = homography(rect, skewed)
    rect.forEach((p, i) => {
      const q = apply(h, p)
      expect(q.x).toBeCloseTo(skewed[i].x, 6)
      expect(q.y).toBeCloseTo(skewed[i].y, 6)
    })
  })

  it('прямоугольник в прямоугольник — просто масштаб', () => {
    const h = homography(rect, defaultQuad(200, 400, 0))
    const mid = apply(h, { x: 50, y: 100 })
    expect(mid.x).toBeCloseTo(100)
    expect(mid.y).toBeCloseTo(200)
  })

  it('размер листа по длинным сторонам и ограничение', () => {
    expect(outputSize(rect, 1000)).toEqual({ w: 100, h: 200 })
    expect(outputSize(rect, 100)).toEqual({ w: 50, h: 100 })
  })
})
