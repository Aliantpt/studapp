import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTerms } from '../profile/context'
import { dayNames, kindLabels, type Lesson, type LessonDraft, type LessonKind, type WeekRule } from './types'

type Props = {
  /** null — закрыто; { day } — новое занятие на этот день */
  editing: Lesson | { day: number } | null
  subjects: string[]
  onSave: (draft: LessonDraft) => void
  onDelete: (lesson: Lesson) => void
  onClose: () => void
}

const weekRules: { value: WeekRule; label: string }[] = [
  { value: 'all', label: 'Каждую' },
  { value: 'odd', label: 'Нечётные' },
  { value: 'even', label: 'Чётные' },
]

const isLesson = (e: Lesson | { day: number }): e is Lesson => 'id' in e

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
          key={isLesson(editing) ? editing.id : `new-${editing.day}`}
          editing={editing}
          titleId={titleId}
          onClose={onClose}
          {...rest}
        />
      )}
    </dialog>
  )
}

type FormProps = Omit<Props, 'editing'> & { editing: Lesson | { day: number }; titleId: string }

function LessonForm({ editing, titleId, subjects, onSave, onDelete, onClose }: FormProps) {
  const terms = useTerms()
  const ids = useId()
  const [draft, setDraft] = useState<LessonDraft>(() =>
    isLesson(editing)
      ? { ...editing }
      : {
          day: editing.day,
          start: terms.slots[0][0],
          end: terms.slots[0][1],
          subject: '',
          room: '',
          teacher: '',
          kind: null,
          week: 'all',
        },
  )

  const set = <K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const timeOk = draft.start < draft.end
  const valid = draft.subject.trim() !== '' && timeOk

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onSave({ ...draft, subject: draft.subject.trim(), room: draft.room.trim(), teacher: draft.teacher.trim() })
  }

  return (
    <form className="sheet-form" onSubmit={submit}>
      <div className="sheet-handle" aria-hidden="true" />
      <h2 id={titleId} className="sheet-title">
        {isLesson(editing) ? terms.lesson[0].toUpperCase() + terms.lesson.slice(1) : terms.newLesson}
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
          autoFocus={!isLesson(editing)}
          autoCapitalize="sentences"
        />
        <datalist id={`${ids}-subjects`}>
          {subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>

      <fieldset className="field">
        <legend className="field-label">День недели</legend>
        <div className="days-pick">
          {dayNames.map((name, i) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={draft.day === i + 1}
              onClick={() => set('day', i + 1)}
            >
              {name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Время</legend>
        <div className="slots">
          {terms.slots.map(([start, end], i) => (
            <button
              key={start}
              type="button"
              className="slot"
              aria-pressed={draft.start === start && draft.end === end}
              aria-label={`${i + 1}-й ${terms.lesson}, ${start}–${end}`}
              onClick={() => setDraft((d) => ({ ...d, start, end }))}
            >
              <span className="slot-num">{i + 1}</span>
              <span className="slot-time">{start}</span>
            </button>
          ))}
        </div>
        <div className="row">
          <input
            className="input"
            type="time"
            aria-label="Начало"
            value={draft.start}
            onChange={(e) => e.target.value && set('start', e.target.value)}
            required
          />
          <input
            className="input"
            type="time"
            aria-label="Конец"
            value={draft.end}
            onChange={(e) => e.target.value && set('end', e.target.value)}
            required
          />
        </div>
        {!timeOk && <span className="field-hint field-hint-error">Конец должен быть позже начала.</span>}
      </fieldset>

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

      {terms.hasKinds && (
        <fieldset className="field">
          <legend className="field-label">По каким неделям</legend>
          <div className="segmented">
            {weekRules.map((w) => (
              <label key={w.value} className="segment">
                <input
                  type="radio"
                  name={`${ids}-week`}
                  checked={draft.week === w.value}
                  onChange={() => set('week', w.value)}
                />
                <span>{w.label}</span>
              </label>
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

      <div className="sheet-actions">
        {isLesson(editing) && (
          <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(editing)}>
            Удалить
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          Сохранить
        </button>
      </div>
    </form>
  )
}
