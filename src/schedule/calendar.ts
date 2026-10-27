import { addDays, toDateKey } from '../planner/dates'
import type { Task } from '../planner/types'
import type { Lesson } from './types'

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 1 — понедельник … 7 — воскресенье */
export function weekday(key: string): number {
  return parseKey(key).getDay() || 7
}

export function mondayOf(key: string): string {
  return addDays(key, 1 - weekday(key))
}

/** сетка месяца по неделям с понедельника, включая хвосты соседних месяцев */
export function monthGrid(year: number, month: number): string[] {
  const first = toDateKey(new Date(year, month, 1))
  const last = toDateKey(new Date(year, month + 1, 0))
  const days: string[] = []
  for (let key = mondayOf(first); key <= last || weekday(key) !== 1; key = addDays(key, 1)) days.push(key)
  return days
}

export function occursOn(lesson: Lesson, key: string): boolean {
  if (lesson.skip.includes(key)) return false
  if (lesson.date === key) return true
  return lesson.repeat === 'weekly' && key > lesson.date && weekday(key) === weekday(lesson.date)
}

export function byStart(a: Lesson, b: Lesson): number {
  return a.start.localeCompare(b.start) || a.createdAt - b.createdAt
}

export function lessonsOn(lessons: Lesson[], key: string): Lesson[] {
  return lessons.filter((l) => occursOn(l, key)).sort(byStart)
}

const sameSubject = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** ближайшее занятие по предмету после текущего момента, ищем на 8 недель вперёд */
export function nextOccurrence(lessons: Lesson[], subject: string, now: Date): { due: string; time: string } | null {
  if (!subject.trim()) return null
  const matching = lessons.filter((l) => sameSubject(l.subject, subject))
  if (!matching.length) return null

  const todayKey = toDateKey(now)
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  for (let i = 0; i < 56; i++) {
    const key = addDays(todayKey, i)
    const hit = lessonsOn(matching, key).find((l) => i > 0 || l.start > nowTime)
    if (hit) return { due: key, time: hit.start }
  }
  return null
}

const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** доля прошедшего времени занятия, null — сейчас не идёт */
export function progress(lesson: Lesson, nowTime: string): number | null {
  if (nowTime < lesson.start || nowTime >= lesson.end) return null
  return (mins(nowTime) - mins(lesson.start)) / (mins(lesson.end) - mins(lesson.start))
}

export function minutesLeft(end: string, nowTime: string): number {
  return mins(end) - mins(nowTime)
}

/** время для новой пары: сразу после последней в этот день, с той же длиной */
export function suggestTime(dayLessons: Lesson[], fallback: [string, string]): [string, string] {
  const last = dayLessons.at(-1)
  if (!last) return fallback
  const length = mins(last.end) - mins(last.start)
  const start = Math.min(mins(last.end) + 10, 23 * 60)
  return [fmt(start), fmt(Math.min(start + length, 23 * 60 + 59))]
}

/**
 * задания, привязанные к парам дня: тот же предмет и срок в этот день.
 * если пар по предмету несколько, задание идёт к паре с тем же временем, иначе к первой
 */
export function tasksByLesson(dayLessons: Lesson[], tasks: Task[], key: string): Map<string, Task[]> {
  const result = new Map<string, Task[]>()
  for (const task of tasks) {
    if (task.due !== key || !task.subject.trim()) continue
    const same = dayLessons.filter((l) => sameSubject(l.subject, task.subject))
    if (!same.length) continue
    const target = same.find((l) => l.start === task.time) ?? same[0]
    result.set(target.id, [...(result.get(target.id) ?? []), task])
  }
  return result
}
