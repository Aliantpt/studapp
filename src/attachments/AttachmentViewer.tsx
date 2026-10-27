import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, FileText, Share2 } from 'lucide-react'
import { buildPdf, shareFile, sharePdf } from '../scanner/pdf'
import type { Scan } from '../scanner/types'
import { useObjectUrl } from '../ui/useObjectUrl'
import { extLabel, sizeLabel, type FileAttachment } from './files'
import { useStoredFile } from './useStoredFile'

export type Viewable = { kind: 'scan'; scan: Scan } | { kind: 'file'; file: FileAttachment }

type Props = { item: Viewable | null; onClose: () => void }

/** полноэкранный просмотр вложения поверх окна задания */
export function AttachmentViewer({ item, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (item && !el.open) el.showModal()
    else if (!item && el.open) el.close()
  }, [item])

  return (
    <dialog
      ref={dialog}
      className="viewer-dialog"
      aria-label="Вложение"
      onClose={(e) => {
        // окно лежит внутри окна задания, не даём событию закрыть и его
        e.stopPropagation()
        onClose()
      }}
    >
      {item && (
        <Body key={item.kind === 'scan' ? item.scan.id : item.file.id} item={item} onClose={onClose} />
      )}
    </dialog>
  )
}

function Body({ item, onClose }: { item: Viewable; onClose: () => void }) {
  const title = item.kind === 'scan' ? item.scan.title : item.file.name
  return (
    <>
      <header className="flow-head">
        <button type="button" className="icon-btn" aria-label="Назад" onClick={onClose}>
          <ArrowLeft size={22} />
        </button>
        <span className="flow-title viewer-dialog-title">{title}</span>
        <span />
      </header>
      {item.kind === 'scan' ? <ScanBody scan={item.scan} /> : <FileBody file={item.file} />}
    </>
  )
}

function ScanBody({ scan }: { scan: Scan }) {
  const [busy, setBusy] = useState(false)

  const share = async () => {
    setBusy(true)
    try {
      await sharePdf(await buildPdf(scan.pages), scan.title)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ol className="viewer-pages viewer-dialog-body">
        {scan.pages.map((page, i) => (
          <li key={i}>
            <Page blob={page} alt={`Страница ${i + 1}`} />
          </li>
        ))}
      </ol>
      <div className="flow-actions">
        <button type="button" className="btn btn-primary btn-wide" disabled={busy} onClick={share}>
          <Share2 size={18} aria-hidden="true" /> {busy ? 'Собираю PDF…' : 'Поделиться PDF'}
        </button>
      </div>
    </>
  )
}

function FileBody({ file }: { file: FileAttachment }) {
  const blob = useStoredFile(file.id)
  const url = useObjectUrl(blob)
  const isImage = file.type.startsWith('image/')

  if (blob === null) {
    return <p className="notice-muted viewer-dialog-body">Файл не нашёлся на этом устройстве.</p>
  }

  return (
    <>
      <div className="viewer-dialog-body">
        {isImage ? (
          <Page blob={blob} alt={file.name} />
        ) : (
          <div className="file-card">
            <span className="file-card-icon" aria-hidden="true">
              <FileText size={32} strokeWidth={1.75} />
            </span>
            <span className="file-card-ext">{extLabel(file.name)}</span>
            <span className="file-card-name">{file.name}</span>
            <span className="file-card-size">{sizeLabel(file.size)}</span>
          </div>
        )}
      </div>
      <div className="flow-actions flow-more">
        {url ? (
          <a className="btn btn-ghost" href={url} target="_blank" rel="noopener">
            <ExternalLink size={18} aria-hidden="true" /> Открыть
          </a>
        ) : (
          <span className="btn btn-ghost" aria-disabled="true">
            Открыть
          </span>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!blob}
          onClick={() => blob && void shareFile(blob, file.name)}
        >
          <Share2 size={18} aria-hidden="true" /> Поделиться
        </button>
      </div>
    </>
  )
}

function Page({ blob, alt }: { blob: Blob | null | undefined; alt: string }) {
  const url = useObjectUrl(blob)
  return url ? <img className="viewer-page" src={url} alt={alt} /> : <div className="viewer-page" />
}
