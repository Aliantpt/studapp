import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTerms } from '../profile/context'
import { parseKey, weekday } from './calendar'
import { kindLabels, type Lesson, type LessonDraft, type LessonKind } from './types'

/** null — закрыто; new — новое занятие на дату; edit — занятие, открытое в конкретный день */
export type LessonEditing =
  | { mode: 'new'; date: string; start: string; end: string }
  | { mode: 'edit'; lesson: Lesson; date: string }
  | null

type Props = {
  editing: LessonEditing
  subjects: string[]
  onSave: (draft: LessonDraft) => void
  onDelete: (lesson: Lesson, scope: 'day' | 'all') => void
  onClose: () => void
}

const everyDay = [
  'каждый понедельник',
  'каждый вторник',
  'каждую среду',
  'каждый четверг',
  'каждую пятницу',
  'каждую субботу',
  'каждое воскресенье',
]
const dateLong = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function LessonSheet({ editing, onClose, ...rest }: Props) {
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
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {editing && (
        <LessonForm
          key={editing.mode === 'edit' ? `${editing.lesson.id}-${editing.date}` : `new-${editing.date}`}
          editing={editing}
          titleId={titleId}
          onClose={onClose}
          {...rest}
        />
      )}
    </dialog>
  )
}

type FormProps = Omit<Props, 'editing'> & { editing: NonNullable<LessonEditing>; titleId: string }

function LessonForm({ editing, titleId, subjects, onSave, onDelete, onClose }: FormProps) {
  const terms = useTerms()
  const ids = useId()
  const [draft, setDraft] = useState<LessonDraft>(() =>
    editing.mode === 'edit'
      ? {
          date: editing.lesson.date,
          start: editing.lesson.start,
          end: editing.lesson.end,
          subject: editing.lesson.subject,
          room: editing.lesson.room,
          teacher: editing.lesson.teacher,
          kind: editing.lesson.kind,
          repeat: editing.lesson.repeat,
        }
      : {
          date: editing.date,
          start: editing.start,
          end: editing.end,
          subject: '',
          room: '',
          teacher: '',
          kind: null,
          repeat: 'none',
        },
  )

  const set = <K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const timeOk = draft.start < draft.end
  const valid = draft.subject.trim() !== '' && timeOk
  const isEdit = editing.mode === 'edit'
  const isSeries = isEdit && editing.lesson.repeat === 'weekly'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave({ ...draft, subject: draft.subject.trim(), room: draft.room.trim(), teacher: draft.teacher.trim() })
  }

  const title = isEdit ? terms.lesson[0].toUpperCase() + terms.lesson.slice(1) : terms.newLesson

  return (
    <form className="sheet-form" onSubmit={submit}>
      <div className="sheet-handle" aria-hidden="true" />
      <h2 id={titleId} className="sheet-title">
        {title}
      </h2>

      <label className="field">
        <span className="field-label">{terms.subjectLabel}</span>
        <input
          className="input"
          value={draft.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder={terms.subjectPlaceholder}
          list={`${ids}-subjects`}
          required
          autoFocus={!isEdit}
          autoCapitalize="sentences"
        />
        <datalist id={`${ids}-subjects`}>
          {subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>

      <fieldset className="field">
        <legend className="field-label">Когда</legend>
        <input
          className="input"
          type="date"
          aria-label="Дата"
          value={draft.date}
          onChange={(e) => e.target.value && set('date', e.target.value)}
          required
        />
        <div className="row">
          <label className="field">
            <span className="field-hint">Начало</span>
            <input
              className="input"
              type="time"
              value={draft.start}
              onChange={(e) => e.target.value && set('start', e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-hint">Конец</span>
            <input
              className="input"
              type="time"
              value={draft.end}
              onChange={(e) => e.target.value && set('end', e.target.value)}
              required
            />
          </label>
        </div>
        {!timeOk && <span className="field-hint field-hint-error">Конец должен быть позже начала.</span>}
      </fieldset>

      <label className="switch">
        <input
          type="checkbox"
          checked={draft.repeat === 'weekly'}
          onChange={(e) => set('repeat', e.target.checked ? 'weekly' : 'none')}
        />
        <span className="switch-text">
          <span>Повторять каждую неделю</span>
          <span className="field-hint">
            {draft.repeat === 'weekly'
              ? `${everyDay[weekday(draft.date) - 1][0].toUpperCase()}${everyDay[weekday(draft.date) - 1].slice(1)}, начиная с ${dateLong.format(parseKey(draft.date))}`
              : 'Только в этот день'}
          </span>
        </span>
        <span className="switch-track" aria-hidden="true" />
      </label>

      {terms.hasKinds && (
        <fieldset className="field">
          <legend className="field-label">Тип занятия</legend>
          <div className="chips chips-wrap">
            {(Object.keys(kindLabels) as LessonKind[]).map((k) => (
              <button
                key={k}
                type="button"
                className="chip"
                aria-pressed={draft.kind === k}
                onClick={() => set('kind', draft.kind === k ? null : k)}
              >
                {kindLabels[k]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="row">
        <label className="field">
          <span className="field-label">{terms.roomLabel}</span>
          <input
            className="input"
            value={draft.room}
            onChange={(e) => set('room', e.target.value)}
            placeholder={terms.roomPlaceholder}
          />
        </label>
        <label className="field">
          <span className="field-label">{terms.teacherLabel}</span>
          <input
            className="input"
            value={draft.teacher}
            onChange={(e) => set('teacher', e.target.value)}
            placeholder={terms.teacherPlaceholder}
          />
        </label>
      </div>

      {isSeries && <p className="field-hint">Изменения применятся ко всем повторам.</p>}

      <div className="sheet-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          Сохранить
        </button>
      </div>

      {isEdit && (
        <div className="sheet-danger">
          {isSeries ? (
            <>
              <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(editing.lesson, 'day')}>
                Удалить только {dateLong.format(parseKey(editing.date))}
              </button>
              <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(editing.lesson, 'all')}>
                Удалить все повторы
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(editing.lesson, 'all')}>
              Удалить
            </button>
          )}
        </div>
      )}
    </form>
  )
}
