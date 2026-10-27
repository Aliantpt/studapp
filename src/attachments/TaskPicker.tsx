import { useEffect, useId, useRef } from 'react'
import { Check } from 'lucide-react'
import { byDue, dueLabel } from '../planner/dates'
import type { Task } from '../planner/types'
import { linkedTo } from './links'

type Props = {
  open: boolean
  tasks: Task[]
  /** id скана, который привязываем */
  scanId: string
  subject: string
  todayKey: string
  onToggle: (task: Task) => void
  onCreate: () => void
  onClose: () => void
}

/** список заданий, к которым можно прикрепить скан */
export function TaskPicker({ open, tasks, scanId, subject, todayKey, onToggle, onCreate, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  // открытые задания, сначала по тому же предмету; уже привязанные тоже оставляем, чтобы можно было отвязать
  const sameSubject = (t: Task) => Number(!!subject && t.subject.toLowerCase() === subject.toLowerCase())
  const list = tasks
    .filter((t) => !t.done || linkedTo(t, scanId))
    .sort((a, b) => sameSubject(b) - sameSubject(a) || byDue(a, b))

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet-form">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id={titleId} className="sheet-title">
          Прикрепить к заданию
        </h2>

        {list.length === 0 ? (
          <p className="field-hint">Открытых заданий нет. Можно сразу создать новое из этого скана.</p>
        ) : (
          <ul className="pick-list">
            {list.map((t) => {
              const on = linkedTo(t, scanId)
              return (
                <li key={t.id}>
                  <button type="button" className="pick-row" aria-pressed={on} onClick={() => onToggle(t)}>
                    <span className="pick-check" aria-hidden="true">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className="pick-text">
                      <span className="task-title">{t.title}</span>
                      <span className="task-meta">
                        {t.subject && <span className="task-subject">{t.subject}</span>}
                        <span>{dueLabel(t, todayKey)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCreate}>
            Новое задание
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Готово
          </button>
        </div>
      </div>
    </dialog>
  )
}
