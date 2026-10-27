import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react'
import { useTerms } from '../profile/context'
import { Toast } from '../ui/Toast'
import { useToast } from '../ui/useToast'
import { lessonsOn, minutesLeft, monthGrid, parseKey, progress, suggestTime } from './calendar'
import { LessonSheet, type LessonEditing } from './LessonSheet'
import { useSchedule } from './storage'
import { dayNames, kindLabels, type Lesson, type LessonDraft } from './types'

type Props = { todayKey: string; now: number }

const monthTitle = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const dayTitle = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)

export function ScheduleScreen({ todayKey, now }: Props) {
  const terms = useTerms()
  const { lessons, add, update, remove, skipDay, unskipDay, restore } = useSchedule()
  const [selected, setSelected] = useState(todayKey)
  const [month, setMonth] = useState(() => {
    const d = parseKey(todayKey)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [editing, setEditing] = useState<LessonEditing>(null)
  const [toast, setToast] = useToast()

  const grid = useMemo(() => monthGrid(month.y, month.m), [month])
  const counts = useMemo(() => new Map(grid.map((k) => [k, lessonsOn(lessons, k).length])), [grid, lessons])
  const dayLessons = useMemo(() => lessonsOn(lessons, selected), [lessons, selected])
  const subjects = useMemo(
    () => [...new Set(lessons.map((l) => l.subject))].sort((a, b) => a.localeCompare(b, 'ru')),
    [lessons],
  )

  const nowDate = new Date(now)
  const nowTime = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`
  const isToday = selected === todayKey
  const today = parseKey(todayKey)
  const onCurrentMonth = month.y === today.getFullYear() && month.m === today.getMonth()

  const shiftMonth = (n: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + n, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const pick = (key: string) => {
    setSelected(key)
    const d = parseKey(key)
    setMonth({ y: d.getFullYear(), m: d.getMonth() })
  }

  const openNew = () => {
    const [start, end] = suggestTime(dayLessons, terms.firstLesson)
    setEditing({ mode: 'new', date: selected, start, end })
  }

  const save = (draft: LessonDraft) => {
    if (editing?.mode === 'edit') update(editing.lesson.id, draft)
    else add(draft)
    setEditing(null)
    if (draft.date !== selected && editing?.mode === 'new') pick(draft.date)
  }

  const del = (lesson: Lesson, scope: 'day' | 'all') => {
    const day = editing?.mode === 'edit' ? editing.date : selected
    setEditing(null)
    if (scope === 'day') {
      skipDay(lesson.id, day)
      setToast({ text: 'Занятие убрано из этого дня', undo: () => unskipDay(lesson.id, day) })
    } else {
      remove(lesson.id)
      setToast({ text: 'Занятие удалено', undo: () => restore(lesson) })
    }
  }

  return (
    <>
      <div className="month-bar">
        <button type="button" className="icon-btn" aria-label="Прошлый месяц" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={22} />
        </button>
        <span className="month-title">{capitalize(monthTitle.format(new Date(month.y, month.m, 1)).replace(' г.', ''))}</span>
        <button type="button" className="icon-btn" aria-label="Следующий месяц" onClick={() => shiftMonth(1)}>
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="month" role="grid" aria-label="Календарь">
        <div className="month-row month-head" role="row">
          {dayNames.map((d) => (
            <span key={d} role="columnheader" className="month-weekday">
              {d}
            </span>
          ))}
        </div>
        <div className="month-days" role="rowgroup">
          {grid.map((key) => {
            const d = parseKey(key)
            const count = counts.get(key) ?? 0
            const cls = [
              'mday',
              d.getMonth() !== month.m && 'mday-out',
              key === todayKey && 'mday-today',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                data-date={key}
                className={cls}
                aria-selected={key === selected}
                aria-label={`${dayTitle.format(d)}, ${count ? `${terms.lessonsGen}: ${count}` : `${terms.lessonsGen} нет`}`}
                onClick={() => pick(key)}
              >
                <span className="mday-num">{d.getDate()}</span>
                <span className="mday-dots" aria-hidden="true">
                  {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                    <span key={i} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {(!onCurrentMonth || !isToday) && (
        <button type="button" className="back-today" onClick={() => pick(todayKey)}>
          Вернуться к сегодня
        </button>
      )}

      <div className="day-head">
        <h3 className="day-title">{capitalize(dayTitle.format(parseKey(selected)))}</h3>
        {dayLessons.length > 0 && (
          <button type="button" className="chip" onClick={openNew}>
            <Plus size={16} aria-hidden="true" /> {terms.addLesson}
          </button>
        )}
      </div>

      {dayLessons.length === 0 ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <CalendarDays size={28} strokeWidth={1.75} />
          </span>
          <p className="empty-title">В этот день {terms.lessonsGen} нет</p>
          <p className="empty-hint">
            {lessons.length === 0
              ? `Выберите день в календаре и добавьте ${terms.lessonsPlural}: название, время и место.`
              : 'Выходной или ещё не заполнено.'}
          </p>
          <button type="button" className="btn btn-primary empty-action" onClick={openNew}>
            {terms.addLesson}
          </button>
        </div>
      ) : (
        <ol className="lessons">
          {dayLessons.map((l, i) => {
            const p = isToday ? progress(l, nowTime) : null
            const past = (isToday && nowTime >= l.end) || selected < todayKey
            return (
              <li key={l.id} className={p !== null ? 'lesson lesson-now' : past ? 'lesson lesson-past' : 'lesson'}>
                <div className="lesson-time">
                  <span className="lesson-start">{l.start}</span>
                  <span className="lesson-end">{l.end}</span>
                </div>
                <button
                  type="button"
                  className="lesson-card"
                  onClick={() => setEditing({ mode: 'edit', lesson: l, date: selected })}
                >
                  <span className="lesson-num">{terms.lessonNumber(i + 1)}</span>
                  <span className="lesson-subject">{l.subject}</span>
                  <span className="lesson-meta">
                    {l.kind && <span className="lesson-kind">{kindLabels[l.kind]}</span>}
                    {l.room && <span>{l.room}</span>}
                    {l.teacher && <span>{l.teacher}</span>}
                    {l.repeat === 'weekly' && <Repeat size={14} aria-label="Повторяется каждую неделю" />}
                  </span>
                  {p !== null && (
                    <span className="lesson-progress">
                      <span className="lesson-progress-label">Идёт, осталось {minutesLeft(l.end, nowTime)} мин</span>
                      <span className="lesson-bar" aria-hidden="true">
                        <span style={{ width: `${Math.round(p * 100)}%` }} />
                      </span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <button type="button" className="fab" aria-label={terms.addLesson} onClick={openNew}>
        <Plus size={28} strokeWidth={2.25} />
      </button>

      <LessonSheet
        editing={editing}
        subjects={subjects}
        onSave={save}
        onDelete={del}
        onClose={() => setEditing(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
