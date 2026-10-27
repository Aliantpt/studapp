export type Scan = {
  id: string
  title: string
  subject: string
  createdAt: number
  /** страницы в JPEG */
  pages: Blob[]
  /** маленькое превью первой страницы */
  thumb: Blob
}

export type Point = { x: number; y: number }

/** углы листа: верх-лево, верх-право, низ-право, низ-лево */
export type Quad = [Point, Point, Point, Point]

export type Filter = 'original' | 'color' | 'doc'
