import { useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { addDays } from '../planner/dates'
import { useTerms } from '../profile/context'
import { Toast } from '../ui/Toast'
import { useToast } from '../ui/useToast'
import { LessonSheet } from './LessonSheet'
import { useSchedule } from './storage'
import { dayNames, kindLabels, type Lesson, type LessonDraft } from './types'
import { isOddWeek, lessonsOn, mondayOf, progress, weekday } from './week'

type Props = { todayKey: string; now: number }

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const fullDay = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

function parse(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function minutesLeft(end: string, nowTime: string) {
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  return mins(end) - mins(nowTime)
}

export function ScheduleScreen({ todayKey, now }: Props) {
  const terms = useTerms()
  const { lessons, flip, add, update, remove, restore, toggleFlip } = useSchedule()
  const [selected, setSelected] = useState(todayKey)
  const [editing, setEditing] = useState<Lesson | { day: number } | null>(null)
  const [toast, setToast] = useToast()

  const monday = mondayOf(selected)
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const odd = isOddWeek(selected, flip)
  const usesParity = lessons.some((l) => l.week !== 'all')
  const dayLessons = useMemo(() => lessonsOn(lessons, selected, flip), [lessons, selected, flip])
  const subjects = useMemo(
    () => [...new Set(lessons.map((l) => l.subject))].sort((a, b) => a.localeCompare(b, 'ru')),
    [lessons],
  )

  const nowDate = new Date(now)
  const nowTime = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`
  const isToday = selected === todayKey

  const save = (draft: LessonDraft) => {
    if (editing && 'id' in editing) update(editing.id, draft)
    else add(draft)
    setEditing(null)
  }

  const del = (lesson: Lesson) => {
    setEditing(null)
    remove(lesson.id)
    setToast({ text: 'Занятие удалено', undo: () => restore(lesson) })
  }

  const shiftWeek = (n: number) => setSelected((s) => addDays(s, n * 7))

  return (
    <>
      <div className="week-bar">
        <button type="button" className="icon-btn" aria-label="Прошлая неделя" onClick={() => shiftWeek(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="week-info">
          <span className="week-range">
            {dayMonth.format(parse(week[0]))} – {dayMonth.format(parse(week[6]))}
          </span>
          {(terms.hasKinds || usesParity) && (
            <button
              type="button"
              className="week-parity"
              aria-label={`${odd ? 'Нечётная' : 'Чётная'} неделя. Нажмите, если в вашем вузе считают наоборот`}
              onClick={toggleFlip}
            >
              {odd ? 'Нечётная' : 'Чётная'} неделя
              <ArrowLeftRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <button type="button" className="icon-btn" aria-label="Следующая неделя" onClick={() => shiftWeek(1)}>
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="days" role="tablist" aria-label="Дни недели">
        {week.map((key, i) => {
          const count = lessonsOn(lessons, key, flip).length
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === selected}
              aria-label={`${fullDay.format(parse(key))}, ${count ? `${terms.lessonsGen}: ${count}` : `${terms.lessonsGen} нет`}`}
              className={key === todayKey ? 'day day-today' : 'day'}
              onClick={() => setSelected(key)}
            >
              <span className="day-name">{dayNames[i]}</span>
              <span className="day-num">{parse(key).getDate()}</span>
              <span className={count ? 'day-dot' : 'day-dot day-dot-empty'} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {selected !== todayKey && !week.includes(todayKey) && (
        <button type="button" className="back-today" onClick={() => setSelected(todayKey)}>
          Вернуться к сегодня
        </button>
      )}

      {dayLessons.length === 0 ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <CalendarDays size={28} strokeWidth={1.75} />
          </span>
          <p className="empty-title">В этот день {terms.lessonsGen} нет</p>
          <p className="empty-hint">
            {lessons.length === 0
              ? `Заполните расписание один раз, и оно будет повторяться каждую неделю.`
              : 'Можно отдохнуть или добавить занятие.'}
          </p>
          <button
            type="button"
            className="btn btn-primary empty-action"
            onClick={() => setEditing({ day: weekday(selected) })}
          >
            {terms.addLesson}
          </button>
        </div>
      ) : (
        <ol className="lessons">
          {dayLessons.map((l) => {
            const p = isToday ? progress(l, nowTime) : null
            const past = isToday && nowTime >= l.end
            return (
              <li key={l.id} className={p !== null ? 'lesson lesson-now' : past ? 'lesson lesson-past' : 'lesson'}>
                <div className="lesson-time">
                  <span className="lesson-start">{l.start}</span>
                  <span className="lesson-end">{l.end}</span>
                </div>
                <button type="button" className="lesson-card" onClick={() => setEditing(l)}>
                  <span className="lesson-subject">{l.subject}</span>
                  <span className="lesson-meta">
                    {l.kind && <span className="lesson-kind">{kindLabels[l.kind]}</span>}
                    {l.room && <span>{l.room}</span>}
                    {l.teacher && <span>{l.teacher}</span>}
                    {l.week !== 'all' && <span>по {l.week === 'odd' ? 'нечётным' : 'чётным'}</span>}
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

      <button
        type="button"
        className="fab"
        aria-label={terms.addLesson}
        onClick={() => setEditing({ day: weekday(selected) })}
      >
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
