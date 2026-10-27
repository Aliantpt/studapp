import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTerms } from '../profile/context'
import { addDays } from './dates'
import type { Priority, Task, TaskDraft } from './types'

type Props = {
  /** null — окно закрыто, 'new' — новое задание */
  editing: Task | 'new' | null
  todayKey: string
  subjects: string[]
  onSave: (draft: TaskDraft) => void
  onDelete: (task: Task) => void
  onClose: () => void
}

const priorities: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Не горит' },
  { value: 'normal', label: 'Обычное' },
  { value: 'high', label: 'Важное' },
]

const reminders: { value: string; label: string }[] = [
  { value: '', label: 'Без напоминания' },
  { value: '0', label: 'В момент срока' },
  { value: '15', label: 'За 15 минут' },
  { value: '60', label: 'За час' },
  { value: '180', label: 'За 3 часа' },
  { value: '1440', label: 'За день' },
]

function emptyDraft(todayKey: string): TaskDraft {
  return { title: '', subject: '', due: todayKey, time: null, priority: 'normal', remind: null, note: '' }
}

export function TaskSheet({ editing, onClose, ...rest }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (editing && !el.open) el.showModal()
    else if (!editing && el.open) el.close()
  }, [editing])

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // тап по затемнению закрывает окно
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* форма монтируется заново на каждое открытие, так черновик всегда свежий */}
      {editing && (
        <SheetForm
          key={editing === 'new' ? 'new' : editing.id}
          editing={editing}
          titleId={titleId}
          onClose={onClose}
          {...rest}
        />
      )}
    </dialog>
  )
}

type FormProps = Omit<Props, 'editing'> & { editing: Task | 'new'; titleId: string }

function SheetForm({ editing, titleId, todayKey, subjects, onSave, onDelete, onClose }: FormProps) {
  const [draft, setDraft] = useState<TaskDraft>(() => (editing === 'new' ? emptyDraft(todayKey) : { ...editing }))
  const ids = useId()
  const terms = useTerms()

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    onSave({ ...draft, title, subject: draft.subject.trim(), note: draft.note.trim() })
  }

  const tomorrowKey = addDays(todayKey, 1)
  const isNew = editing === 'new'

  return (
    <form className="sheet-form" onSubmit={submit}>
      <div className="sheet-handle" aria-hidden="true" />
      <h2 id={titleId} className="sheet-title">
        {isNew ? 'Новое задание' : 'Задание'}
      </h2>

      <label className="field">
        <span className="field-label">Что задали</span>
        <input
          className="input"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={terms.taskPlaceholder}
          required
          autoFocus={isNew}
          enterKeyHint="done"
        />
      </label>

      <label className="field">
        <span className="field-label">{terms.subjectLabel}</span>
        <input
          className="input"
          value={draft.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder={terms.subjectPlaceholder}
          list={`${ids}-subjects`}
          autoCapitalize="sentences"
        />
        <datalist id={`${ids}-subjects`}>
          {subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>

      <fieldset className="field">
        <legend className="field-label">Срок</legend>
        <div className="chips">
          <button
            type="button"
            className="chip"
            aria-pressed={draft.due === todayKey}
            onClick={() => set('due', todayKey)}
          >
            Сегодня
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={draft.due === tomorrowKey}
            onClick={() => set('due', tomorrowKey)}
          >
            Завтра
          </button>
        </div>
        <div className="row">
          <input
            className="input"
            type="date"
            aria-label="Дата"
            value={draft.due}
            onChange={(e) => e.target.value && set('due', e.target.value)}
            required
          />
          <input
            className="input"
            type="time"
            aria-label="Время, необязательно"
            value={draft.time ?? ''}
            onChange={(e) => set('time', e.target.value || null)}
          />
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Насколько важно</legend>
        <div className="segmented">
          {priorities.map((p) => (
            <label key={p.value} className="segment">
              <input
                type="radio"
                name={`${ids}-priority`}
                value={p.value}
                checked={draft.priority === p.value}
                onChange={() => set('priority', p.value)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field-label">Напоминание</span>
        <select
          className="input"
          value={draft.remind === null ? '' : String(draft.remind)}
          onChange={(e) => set('remind', e.target.value === '' ? null : Number(e.target.value))}
        >
          {reminders.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {draft.remind !== null && !draft.time && (
          <span className="field-hint">Время не указано, поэтому считаем от 9:00.</span>
        )}
      </label>

      <label className="field">
        <span className="field-label">Заметка</span>
        <textarea
          className="input"
          rows={2}
          value={draft.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Страницы, ссылки, что уточнить"
        />
      </label>

      <div className="sheet-actions">
        {editing !== 'new' && (
          <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(editing)}>
            Удалить
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={!draft.title.trim()}>
          Сохранить
        </button>
      </div>
    </form>
  )
}
