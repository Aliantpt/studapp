import { useEffect, useId, useRef, useState } from 'react'
import { Camera, Check, Images, Maximize, RotateCw, X } from 'lucide-react'
import { useTerms } from '../profile/context'
import { useObjectUrl } from '../ui/useObjectUrl'
import { CropEditor } from './CropEditor'
import { defaultQuad, fullQuad } from './geometry'
import { applyFilter, loadImage, rotate, thumbnail, toJpeg, warp } from './image'
import { knownSubjects } from './subjects'
import type { Filter, Quad, Scan } from './types'

type Props = {
  /** с какого фото начинаем */
  first: File
  onSave: (scan: Scan) => void
  onCancel: () => void
}

type Page = { blob: Blob; canvas: HTMLCanvasElement }

type Editing = {
  source: HTMLCanvasElement
  sourceUrl: string
  quad: Quad
  step: 'crop' | 'filter'
  filter: Filter
  cropped?: HTMLCanvasElement
  preview?: Blob
}

const filters: { value: Filter; label: string }[] = [
  { value: 'doc', label: 'Документ' },
  { value: 'color', label: 'Цвет' },
  { value: 'original', label: 'Как есть' },
]

const dateTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// отдаём браузеру кадр, чтобы показать «Обрабатываю…» до тяжёлых вычислений
const nextFrame = () => new Promise((r) => setTimeout(r, 30))

async function canvasUrl(c: HTMLCanvasElement) {
  return URL.createObjectURL(await toJpeg(c, 0.8))
}

export function ScanFlow({ first, onSave, onCancel }: Props) {
  const terms = useTerms()
  const [pages, setPages] = useState<Page[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [busy, setBusy] = useState<string | null>('Открываю фото…')
  const [title, setTitle] = useState(() => `Скан ${dateTitle.format(new Date())}`)
  const [subject, setSubject] = useState('')
  const [subjects] = useState(knownSubjects)
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const ids = useId()

  const open = async (file: File) => {
    setBusy('Открываю фото…')
    await nextFrame()
    try {
      const source = await loadImage(file)
      setEditing({
        source,
        sourceUrl: await canvasUrl(source),
        quad: defaultQuad(source.width, source.height),
        step: 'crop',
        filter: 'doc',
      })
    } catch {
      alert('Не получилось открыть фото. Попробуйте другое.')
    } finally {
      setBusy(null)
    }
  }

  // первое фото открываем сразу
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    void open(first)
  })

  const makePreview = async (e: Editing, filter: Filter, cropped = e.cropped) => {
    const c = applyFilter(cropped!, filter)
    return { ...e, filter, cropped, preview: await toJpeg(c, 0.8), step: 'filter' as const }
  }

  const toFilter = async () => {
    if (!editing) return
    setBusy('Выпрямляю страницу…')
    await nextFrame()
    const cropped = warp(editing.source, editing.quad)
    setEditing(await makePreview(editing, editing.filter, cropped))
    setBusy(null)
  }

  const pickFilter = async (f: Filter) => {
    if (!editing) return
    setBusy('Применяю фильтр…')
    await nextFrame()
    setEditing(await makePreview(editing, f))
    setBusy(null)
  }

  const turn = async () => {
    if (!editing) return
    URL.revokeObjectURL(editing.sourceUrl)
    const source = rotate(editing.source)
    setEditing({
      ...editing,
      source,
      sourceUrl: await canvasUrl(source),
      quad: defaultQuad(source.width, source.height),
    })
  }

  const accept = async () => {
    if (!editing?.cropped) return
    setBusy('Сохраняю страницу…')
    await nextFrame()
    const c = applyFilter(editing.cropped, editing.filter)
    const blob = await toJpeg(c)
    URL.revokeObjectURL(editing.sourceUrl)
    setPages((p) => [...p, { blob, canvas: c }])
    setEditing(null)
    setBusy(null)
  }

  const save = async () => {
    if (!pages.length) return
    setBusy('Сохраняю скан…')
    onSave({
      id: newId(),
      title: title.trim() || 'Скан',
      subject: subject.trim(),
      createdAt: Date.now(),
      pages: pages.map((p) => p.blob),
      thumb: await thumbnail(pages[0].canvas),
    })
  }

  const cancel = () => {
    if (pages.length && !confirm('Выйти без сохранения? Отсканированные страницы пропадут.')) return
    if (editing) URL.revokeObjectURL(editing.sourceUrl)
    onCancel()
  }

  const pickFile = (input: HTMLInputElement | null) => {
    const file = input?.files?.[0]
    if (input) input.value = ''
    if (file) void open(file)
  }

  return (
    <div className="flow" role="dialog" aria-modal="true" aria-label="Новый скан">
      <header className="flow-head">
        <button type="button" className="icon-btn" aria-label="Закрыть" onClick={cancel}>
          <X size={22} />
        </button>
        <span className="flow-title">
          {editing ? (editing.step === 'crop' ? 'Края листа' : 'Как будет выглядеть') : 'Новый скан'}
        </span>
        <span className="flow-count">{pages.length > 0 && `${pages.length} стр.`}</span>
      </header>

      {editing?.step === 'crop' && (
        <>
          <p className="flow-hint">Перетащите зелёные точки в углы листа.</p>
          <div className="flow-stage">
            <CropEditor
              src={editing.sourceUrl}
              width={editing.source.width}
              height={editing.source.height}
              quad={editing.quad}
              onChange={(quad) => setEditing({ ...editing, quad })}
            />
          </div>
          <div className="flow-tools">
            <button type="button" className="tool" onClick={turn}>
              <RotateCw size={20} aria-hidden="true" />
              Повернуть
            </button>
            <button
              type="button"
              className="tool"
              onClick={() => setEditing({ ...editing, quad: fullQuad(editing.source.width, editing.source.height) })}
            >
              <Maximize size={20} aria-hidden="true" />
              Весь кадр
            </button>
          </div>
          <div className="flow-actions">
            <button type="button" className="btn btn-primary btn-wide" onClick={toFilter}>
              Дальше
            </button>
          </div>
        </>
      )}

      {editing?.step === 'filter' && (
        <>
          <div className="flow-stage">
            <Preview blob={editing.preview} />
          </div>
          <div className="segmented flow-filters">
            {filters.map((f) => (
              <label key={f.value} className="segment">
                <input
                  type="radio"
                  name={`${ids}-filter`}
                  checked={editing.filter === f.value}
                  onChange={() => pickFilter(f.value)}
                />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
          <div className="flow-actions flow-actions-row">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing({ ...editing, step: 'crop' })}>
              Назад
            </button>
            <button type="button" className="btn btn-primary" onClick={accept}>
              <Check size={18} aria-hidden="true" /> Готово
            </button>
          </div>
        </>
      )}

      {!editing && !busy && (
        <div className="flow-review">
          <ol className="flow-pages">
            {pages.map((p, i) => (
              <li key={i} className="flow-page">
                <Preview blob={p.blob} />
                <span className="flow-page-num">{i + 1}</span>
                <button
                  type="button"
                  className="flow-page-remove"
                  aria-label={`Убрать страницу ${i + 1}`}
                  onClick={() => setPages((list) => list.filter((_, j) => j !== i))}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ol>

          <div className="flow-more">
            <button type="button" className="btn btn-ghost" onClick={() => camera.current?.click()}>
              <Camera size={18} aria-hidden="true" /> Снять ещё
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => gallery.current?.click()}>
              <Images size={18} aria-hidden="true" /> Из галереи
            </button>
          </div>

          <label className="field">
            <span className="field-label">Название</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">{terms.subjectLabel}</span>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={terms.subjectPlaceholder}
              list={`${ids}-subjects`}
            />
            <datalist id={`${ids}-subjects`}>
              {subjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <button type="button" className="btn btn-primary btn-wide" disabled={!pages.length} onClick={save}>
            Сохранить скан
          </button>
        </div>
      )}

      {busy && (
        <div className="flow-busy" role="status">
          <span className="spinner" aria-hidden="true" />
          {busy}
        </div>
      )}

      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => pickFile(e.currentTarget)}
      />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.currentTarget)} />
    </div>
  )
}

function Preview({ blob }: { blob?: Blob }) {
  const url = useObjectUrl(blob)
  return url ? <img className="flow-img" src={url} alt="" /> : null
}
