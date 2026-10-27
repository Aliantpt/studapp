import type { Task } from './types'

// если время не указано, считаем срок концом дня, а напоминания — от 9 утра
const DAY_END = '23:59'
const DEFAULT_REMIND_BASE = '09:00'

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return toDateKey(new Date(y, m - 1, d + days))
}

function at(key: string, time: string): number {
  const [y, m, d] = key.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min).getTime()
}

export function dueAt(task: Pick<Task, 'due' | 'time'>): number {
  return at(task.due, task.time ?? DAY_END)
}

export function remindAt(task: Pick<Task, 'due' | 'time' | 'remind'>): number | null {
  if (task.remind === null) return null
  return at(task.due, task.time ?? DEFAULT_REMIND_BASE) - task.remind * 60_000
}

export function isOverdue(task: Task, now: number): boolean {
  return !task.done && dueAt(task) < now
}

export function byDue(a: Task, b: Task): number {
  return dueAt(a) - dueAt(b) || a.createdAt - b.createdAt
}

const weekdayShort = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

/** «Сегодня», «Завтра», «Вчера» или «чт, 30 октября» */
export function dayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return 'Сегодня'
  if (key === addDays(todayKey, 1)) return 'Завтра'
  if (key === addDays(todayKey, -1)) return 'Вчера'
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${weekdayShort.format(date)}, ${dayMonth.format(date)}`
}

/** короткая подпись срока для строки задания */
export function dueLabel(task: Pick<Task, 'due' | 'time'>, todayKey: string): string {
  const day = dayLabel(task.due, todayKey)
  const short = day === 'Сегодня' || day === 'Завтра' || day === 'Вчера' ? day.toLowerCase() : day
  return task.time ? `${short}, ${task.time}` : short
}
