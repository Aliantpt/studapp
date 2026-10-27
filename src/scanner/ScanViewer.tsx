import { useState } from 'react'
import { ArrowLeft, Share2, Trash2 } from 'lucide-react'
import { useTerms } from '../profile/context'
import { useObjectUrl } from '../ui/useObjectUrl'
import { buildPdf, sharePdf } from './pdf'
import type { Scan } from './types'

type Props = {
  scan: Scan
  onChange: (scan: Scan) => void
  onDelete: (scan: Scan) => void
  onClose: () => void
}

export function ScanViewer({ scan, onChange, onDelete, onClose }: Props) {
  const terms = useTerms()
  const [title, setTitle] = useState(scan.title)
  const [subject, setSubject] = useState(scan.subject)
  const [busy, setBusy] = useState(false)

  const commit = () => {
    const next = { ...scan, title: title.trim() || scan.title, subject: subject.trim() }
    if (next.title !== scan.title || next.subject !== scan.subject) onChange(next)
  }

  const share = async () => {
    setBusy(true)
    try {
      await sharePdf(await buildPdf(scan.pages), scan.title)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flow" role="dialog" aria-modal="true" aria-label={scan.title}>
      <header className="flow-head">
        <button type="button" className="icon-btn" aria-label="Назад" onClick={onClose}>
          <ArrowLeft size={22} />
        </button>
        <span className="flow-title">{scan.pages.length} стр.</span>
        <button type="button" className="icon-btn" aria-label="Удалить скан" onClick={() => onDelete(scan)}>
          <Trash2 size={20} />
        </button>
      </header>

      <div className="viewer">
        <input
          className="viewer-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          aria-label="Название"
        />
        <input
          className="viewer-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onBlur={commit}
          placeholder={terms.subjectLabel}
          aria-label={terms.subjectLabel}
        />

        <ol className="viewer-pages">
          {scan.pages.map((page, i) => (
            <li key={i}>
              <Page blob={page} n={i + 1} />
            </li>
          ))}
        </ol>
      </div>

      <div className="flow-actions">
        <button type="button" className="btn btn-primary btn-wide" disabled={busy} onClick={share}>
          <Share2 size={18} aria-hidden="true" /> {busy ? 'Собираю PDF…' : 'Поделиться PDF'}
        </button>
      </div>
    </div>
  )
}

function Page({ blob, n }: { blob: Blob; n: number }) {
  const url = useObjectUrl(blob)
  return url ? <img className="viewer-page" src={url} alt={`Страница ${n}`} /> : <div className="viewer-page" />
}
