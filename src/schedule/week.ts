import { addDays, toDateKey } from '../planner/dates'
import type { Lesson } from './types'

function parse(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 1 — понедельник … 7 — воскресенье */
export function weekday(key: string): number {
  return parse(key).getDay() || 7
}

export function mondayOf(key: string): string {
  return addDays(key, 1 - weekday(key))
}

/** номер недели по ISO 8601 */
export function isoWeek(key: string): number {
  const d = parse(key)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86_400_000 + 1) / 7)
}

/** flip — если в вузе считают наоборот, человек переключает это сам */
export function isOddWeek(key: string, flip: boolean): boolean {
  return (isoWeek(key) % 2 === 1) !== flip
}

export function occursOn(lesson: Lesson, key: string, flip: boolean): boolean {
  if (lesson.day !== weekday(key)) return false
  if (lesson.week === 'all') return true
  return (lesson.week === 'odd') === isOddWeek(key, flip)
}

export function byStart(a: Lesson, b: Lesson): number {
  return a.start.localeCompare(b.start) || a.createdAt - b.createdAt
}

export function lessonsOn(lessons: Lesson[], key: string, flip: boolean): Lesson[] {
  return lessons.filter((l) => occursOn(l, key, flip)).sort(byStart)
}

const sameSubject = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** ближайшее занятие по предмету после текущего момента, ищем на 4 недели вперёд */
export function nextOccurrence(
  lessons: Lesson[],
  subject: string,
  now: Date,
  flip: boolean,
): { due: string; time: string } | null {
  if (!subject.trim()) return null
  const matching = lessons.filter((l) => sameSubject(l.subject, subject))
  if (!matching.length) return null

  const todayKey = toDateKey(now)
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  for (let i = 0; i < 28; i++) {
    const key = addDays(todayKey, i)
    const hit = lessonsOn(matching, key, flip).find((l) => i > 0 || l.start > nowTime)
    if (hit) return { due: key, time: hit.start }
  }
  return null
}

/** сколько минут прошло от начала занятия, null — сейчас не идёт */
export function progress(lesson: Lesson, nowTime: string): number | null {
  if (nowTime < lesson.start || nowTime >= lesson.end) return null
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  return (mins(nowTime) - mins(lesson.start)) / (mins(lesson.end) - mins(lesson.start))
}
