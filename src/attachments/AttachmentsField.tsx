import { useEffect, useRef, useState } from 'react'
import { Check, Paperclip, ScanLine, X } from 'lucide-react'
import type { Attachment } from '../planner/types'
import { scansDb } from '../scanner/db'
import type { Scan } from '../scanner/types'
import { useObjectUrl } from '../ui/useObjectUrl'
import { AttachmentViewer, type Viewable } from './AttachmentViewer'
import { extLabel, sizeLabel, storeFiles, type FileAttachment } from './files'
import { useStoredFile } from './useStoredFile'

type Props = {
  value: Attachment[]
  /** предмет задания: сканы по нему показываем первыми */
  subject: string
  onAdd: (items: Attachment[]) => void
  onRemove: (id: string) => void
}

// что обычно скидывают по учёбе; image/* на телефоне даёт выбрать из галереи или снять фото
const accept = 'image/*,application/pdf,.doc,.docx,.odt,.rtf,.txt,.ppt,.pptx,.xls,.xlsx'

export function AttachmentsField({ value, subject, onAdd, onRemove }: Props) {
  const [scans, setScans] = useState<Scan[] | null>(null)
  const [picking, setPicking] = useState(false)
  const [viewing, setViewing] = useState<Viewable | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scansDb
      .all()
      .then(setScans)
      .catch(() => setScans([]))
  }, [])

  const byId = new Map(scans?.map((s) => [s.id, s]))
  const attachedScans = new Set(value.filter((a) => a.kind === 'scan').map((a) => a.id))
  // скан могли удалить в сканере — такие просто не показываем
  const shown = value.filter((a) => a.kind === 'file' || !scans || byId.has(a.id))

  const pickFiles = async (list: FileList | null) => {
    const files = [...(list ?? [])]
    if (input.current) input.current.value = ''
    if (!files.length) return
    setBusy(true)
    setError('')
    try {
      const { added, tooBig } = await storeFiles(files)
      if (added.length) onAdd(added)
      if (tooBig.length) setError(`Слишком большой файл (больше 30 МБ): ${tooBig.join(', ')}`)
    } catch {
      setError('Не хватило места на телефоне, файл не добавился')
    } finally {
      setBusy(false)
    }
  }

  const toggleScan = (scan: Scan) => {
    if (attachedScans.has(scan.id)) onRemove(scan.id)
    else onAdd([{ kind: 'scan', id: scan.id }])
  }

  const scanList = [...(scans ?? [])].sort(
    (a, b) => Number(b.subject === subject && !!subject) - Number(a.subject === subject && !!subject) || b.createdAt - a.createdAt,
  )

  return (
    <fieldset className="field">
      <legend className="field-label">Вложения</legend>

      {shown.length > 0 && (
        <ul className="attach-grid">
          {shown.map((a) =>
            a.kind === 'scan' ? (
              <ScanTile
                key={a.id}
                scan={byId.get(a.id)}
                onOpen={(scan) => setViewing({ kind: 'scan', scan })}
                onRemove={() => onRemove(a.id)}
              />
            ) : (
              <FileTile
                key={a.id}
                file={a}
                onOpen={() => setViewing({ kind: 'file', file: a })}
                onRemove={() => onRemove(a.id)}
              />
            ),
          )}
        </ul>
      )}

      <div className="chips chips-wrap">
        <button type="button" className="chip chip-icon" disabled={busy} onClick={() => input.current?.click()}>
          <Paperclip size={16} aria-hidden="true" /> {busy ? 'Добавляю…' : 'Фото или файл'}
        </button>
        <button
          type="button"
          className="chip chip-icon"
          aria-expanded={picking}
          aria-pressed={picking}
          onClick={() => setPicking((v) => !v)}
        >
          <ScanLine size={16} aria-hidden="true" /> Из сканера
        </button>
      </div>

      {picking &&
        (scans && scans.length === 0 ? (
          <span className="field-hint">Сканов пока нет. Их можно сделать в разделе «Сканер».</span>
        ) : (
          <ul className="scan-strip" aria-label="Сканы">
            {scanList.map((s) => (
              <li key={s.id}>
                <StripItem scan={s} picked={attachedScans.has(s.id)} onToggle={() => toggleScan(s)} />
              </li>
            ))}
          </ul>
        ))}

      {error && <span className="field-hint field-error">{error}</span>}

      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => void pickFiles(e.currentTarget.files)}
      />
      <AttachmentViewer item={viewing} onClose={() => setViewing(null)} />
    </fieldset>
  )
}

type TileProps = { onRemove: () => void }

function ScanTile({ scan, onOpen, onRemove }: TileProps & { scan?: Scan; onOpen: (scan: Scan) => void }) {
  const url = useObjectUrl(scan?.thumb)
  const name = scan?.title ?? 'Скан'
  return (
    <li className="attach">
      <button
        type="button"
        className="attach-open"
        disabled={!scan}
        aria-label={`Открыть «${name}»`}
        onClick={() => scan && onOpen(scan)}
      >
        <span className="attach-thumb">{url && <img src={url} alt="" />}</span>
        <span className="attach-name">{name}</span>
        <span className="attach-meta">{scan ? `Скан, ${scan.pages.length} стр.` : 'Скан'}</span>
      </button>
      <RemoveButton name={name} onRemove={onRemove} />
    </li>
  )
}

function FileTile({ file, onOpen, onRemove }: TileProps & { file: FileAttachment; onOpen: () => void }) {
  const isImage = file.type.startsWith('image/')
  const blob = useStoredFile(isImage ? file.id : null)
  const url = useObjectUrl(blob)
  return (
    <li className="attach">
      <button type="button" className="attach-open" aria-label={`Открыть «${file.name}»`} onClick={onOpen}>
        <span className="attach-thumb">
          {url ? <img src={url} alt="" /> : !isImage && <span className="attach-ext">{extLabel(file.name)}</span>}
        </span>
        <span className="attach-name">{file.name}</span>
        <span className="attach-meta">{sizeLabel(file.size)}</span>
      </button>
      <RemoveButton name={file.name} onRemove={onRemove} />
    </li>
  )
}

function RemoveButton({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <button type="button" className="attach-remove" aria-label={`Убрать «${name}»`} onClick={onRemove}>
      <X size={14} strokeWidth={2.5} />
    </button>
  )
}

function StripItem({ scan, picked, onToggle }: { scan: Scan; picked: boolean; onToggle: () => void }) {
  const url = useObjectUrl(scan.thumb)
  return (
    <button type="button" className="strip-item" aria-pressed={picked} onClick={onToggle}>
      <span className="attach-thumb">
        {url && <img src={url} alt="" />}
        {picked && (
          <span className="strip-check" aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="attach-name">{scan.title}</span>
      {scan.subject && <span className="attach-meta">{scan.subject}</span>}
    </button>
  )
}
