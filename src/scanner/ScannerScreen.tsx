import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Images, ScanLine, Search } from 'lucide-react'
import { linkedTo } from '../attachments/links'
import { TaskPicker } from '../attachments/TaskPicker'
import { permissionProblem } from '../planner/reminders'
import { useTasks } from '../planner/storage'
import { TaskSheet } from '../planner/TaskSheet'
import type { Task, TaskDraft } from '../planner/types'
import { useTerms } from '../profile/context'
import { nextOccurrence } from '../schedule/calendar'
import { loadSchedule } from '../schedule/storage'
import { Toast } from '../ui/Toast'
import { useObjectUrl } from '../ui/useObjectUrl'
import { useToast } from '../ui/useToast'
import { askPersist, scansDb } from './db'
import { ScanFlow } from './ScanFlow'
import { ScanViewer } from './ScanViewer'
import type { Scan } from './types'

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

export function ScannerScreen({ todayKey }: { todayKey: string }) {
  const terms = useTerms()
  const { tasks, add, update } = useTasks()
  const [picking, setPicking] = useState(false)
  const [creating, setCreating] = useState<Partial<TaskDraft> | null>(null)
  const [scans, setScans] = useState<Scan[] | null>(null)
  const [query, setQuery] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [viewing, setViewing] = useState<Scan | null>(null)
  const [toast, setToast] = useToast()
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scansDb
      .all()
      .then((list) => setScans(list.sort((a, b) => b.createdAt - a.createdAt)))
      .catch(() => setScans([]))
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!scans || !q) return scans ?? []
    return scans.filter((s) => s.title.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q))
  }, [scans, query])

  const pick = (input: HTMLInputElement | null) => {
    const f = input?.files?.[0]
    if (input) input.value = ''
    if (f) setFile(f)
  }

  const save = async (scan: Scan) => {
    setFile(null)
    try {
      await scansDb.put(scan)
      setScans((list) => [scan, ...(list ?? [])])
      void askPersist()
      setToast({ text: 'Скан сохранён' })
    } catch {
      setToast({ text: 'Не хватило места на телефоне, скан не сохранился' })
    }
  }

  const change = async (scan: Scan) => {
    setScans((list) => list?.map((s) => (s.id === scan.id ? scan : s)) ?? null)
    setViewing(scan)
    await scansDb.put(scan).catch(() => undefined)
  }

  const remove = async (scan: Scan) => {
    setViewing(null)
    // скан пропадает и из заданий, «Вернуть» прикрепит обратно
    const touched = tasks.filter((t) => linkedTo(t, scan.id))
    for (const t of touched) update(t.id, { attachments: t.attachments?.filter((a) => a.id !== scan.id) })
    setScans((list) => list?.filter((s) => s.id !== scan.id) ?? null)
    await scansDb.remove(scan.id).catch(() => undefined)
    setToast({
      text: 'Скан удалён',
      undo: () => {
        void scansDb.put(scan)
        for (const t of touched) update(t.id, { attachments: t.attachments })
        setScans((list) => [...(list ?? []), scan].sort((a, b) => b.createdAt - a.createdAt))
      },
    })
  }

  const toggleLink = (task: Task) => {
    if (!viewing) return
    const list = task.attachments ?? []
    update(task.id, {
      attachments: linkedTo(task, viewing.id)
        ? list.filter((a) => a.id !== viewing.id)
        : [...list, { kind: 'scan', id: viewing.id }],
    })
  }

  const startTask = () => {
    if (!viewing) return
    setPicking(false)
    // название «Скан 27 октября» для задания бесполезно, такое не подставляем
    const title = /^Скан(\s|$)/.test(viewing.title) ? '' : viewing.title
    const next = viewing.subject ? nextOccurrence(loadSchedule(), viewing.subject, new Date()) : null
    setCreating({
      title,
      subject: viewing.subject,
      attachments: [{ kind: 'scan', id: viewing.id }],
      ...(next ?? {}),
    })
  }

  const saveTask = async (draft: TaskDraft) => {
    setCreating(null)
    add(draft)
    setToast({ text: 'Задание создано, скан прикреплён' })
    if (draft.remind !== null) {
      const problem = await permissionProblem()
      if (problem) setToast({ text: problem })
    }
  }

  const subjects = [...new Set([...tasks, ...(scans ?? [])].map((x) => x.subject).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  )

  return (
    <>
      {scans && scans.length > 0 && (
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Название или ${terms.subjectLabel.toLowerCase()}`}
            aria-label="Поиск по сканам"
            type="search"
          />
        </label>
      )}

      {scans && scans.length === 0 && (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <ScanLine size={28} strokeWidth={1.75} />
          </span>
          <p className="empty-title">Сканов пока нет</p>
          <p className="empty-hint">{terms.scannerHint}</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={() => camera.current?.click()}>
              <Camera size={18} aria-hidden="true" /> Сфотографировать
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => gallery.current?.click()}>
              <Images size={18} aria-hidden="true" /> Из галереи
            </button>
          </div>
        </div>
      )}

      {scans && scans.length > 0 && shown.length === 0 && <p className="notice-muted">Ничего не нашлось.</p>}

      <ul className="scans">
        {shown.map((s) => (
          <li key={s.id}>
            <button type="button" className="scan-card" onClick={() => setViewing(s)}>
              <Thumb blob={s.thumb} />
              <span className="scan-title">{s.title}</span>
              <span className="scan-meta">
                {s.subject && <span className="task-subject">{s.subject}</span>}
                <span>
                  {shortDate.format(s.createdAt)}, {s.pages.length} стр.
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {scans && scans.length > 0 && (
        <button type="button" className="fab" aria-label="Новый скан" onClick={() => camera.current?.click()}>
          <Camera size={26} strokeWidth={2.25} />
        </button>
      )}

      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => pick(e.currentTarget)}
      />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => pick(e.currentTarget)} />

      {file && <ScanFlow first={file} onSave={save} onCancel={() => setFile(null)} />}
      {viewing && (
        <ScanViewer
          scan={viewing}
          onChange={change}
          onDelete={remove}
          onClose={() => setViewing(null)}
          linked={tasks.filter((t) => linkedTo(t, viewing.id))}
          todayKey={todayKey}
          onLink={() => setPicking(true)}
          onUnlink={toggleLink}
          onCreateTask={startTask}
        />
      )}

      <TaskPicker
        open={picking && !!viewing}
        tasks={tasks}
        scanId={viewing?.id ?? ''}
        subject={viewing?.subject ?? ''}
        todayKey={todayKey}
        onToggle={toggleLink}
        onCreate={startTask}
        onClose={() => setPicking(false)}
      />

      <TaskSheet
        editing={creating ? 'new' : null}
        preset={creating ?? undefined}
        todayKey={todayKey}
        subjects={subjects}
        onSave={saveTask}
        onDelete={() => setCreating(null)}
        onClose={() => setCreating(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}

function Thumb({ blob }: { blob: Blob }) {
  const url = useObjectUrl(blob)
  return <span className="scan-thumb">{url && <img src={url} alt="" />}</span>
}
