import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Quad } from './types'

type Props = {
  src: string
  width: number
  height: number
  quad: Quad
  onChange: (quad: Quad) => void
}

/** картинка и четыре угла, которые можно таскать пальцем */
export function CropEditor({ src, width, height, quad, onChange }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  // ширина картинки на экране, чтобы ручки были под палец при любом масштабе
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setShown(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const toImage = (e: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(width, ((e.clientX - box.left) / box.width) * width)),
      y: Math.max(0, Math.min(height, ((e.clientY - box.top) / box.height) * height)),
    }
  }

  const move = (e: PointerEvent) => {
    if (drag === null) return
    const next = [...quad] as Quad
    next[drag] = toImage(e)
    onChange(next)
  }

  // радиус ручки в пикселях картинки, на экране ~44px
  const scale = shown ? width / shown : 1
  const r = 22 * scale
  const pts = quad.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div
      className="crop"
      style={{ aspectRatio: `${width} / ${height}`, width: `min(100%, calc(62dvh * ${width / height}))` }}
    >
      <img src={src} alt="Снимок страницы" draggable={false} />
      <svg
        ref={svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <path
          className="crop-shade"
          fillRule="evenodd"
          d={`M0 0H${width}V${height}H0Z M${pts.replace(/ /g, ' L')}Z`}
        />
        <polygon className="crop-edge" points={pts} style={{ strokeWidth: 3 * scale }} />
        {quad.map((p, i) => (
          <circle
            key={i}
            className={drag === i ? 'crop-handle crop-handle-active' : 'crop-handle'}
            cx={p.x}
            cy={p.y}
            r={r}
            style={{ strokeWidth: 3 * scale }}
            role="slider"
            aria-label={['Левый верхний угол', 'Правый верхний угол', 'Правый нижний угол', 'Левый нижний угол'][i]}
            onPointerDown={(e) => {
              ;(e.target as Element).setPointerCapture(e.pointerId)
              setDrag(i)
            }}
          />
        ))}
      </svg>
    </div>
  )
}
