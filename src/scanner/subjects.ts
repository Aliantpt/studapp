import { loadTasks } from '../planner/storage'
import { loadSchedule } from '../schedule/storage'

/** все предметы, которые уже встречались в планере и расписании */
export function knownSubjects(): string[] {
  const all = [...loadTasks().map((t) => t.subject), ...loadSchedule().map((l) => l.subject)]
  return [...new Set(all.map((s) => s.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'))
}
