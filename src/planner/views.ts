import { addDays, byDue, isOverdue } from './dates'
import type { Task } from './types'

export type ViewId = 'today' | 'week' | 'overdue' | 'all'

export type Group = { key: string; overdue?: boolean; tasks: Task[] }

export type View = { groups: Group[]; done: Task[] }

function groupByDay(tasks: Task[]): Group[] {
  const groups: Group[] = []
  for (const task of tasks) {
    const last = groups.at(-1)
    if (last && last.key === task.due) last.tasks.push(task)
    else groups.push({ key: task.due, tasks: [task] })
  }
  return groups
}

export function buildView(view: ViewId, all: Task[], todayKey: string, now: number): View {
  const sorted = [...all].sort(byDue)
  const open = sorted.filter((t) => !t.done)
  const done = sorted.filter((t) => t.done)
  const weekEnd = addDays(todayKey, 6)

  switch (view) {
    case 'today': {
      const late = open.filter((t) => isOverdue(t, now))
      const today = open.filter((t) => t.due === todayKey && !isOverdue(t, now))
      const groups: Group[] = []
      if (late.length) groups.push({ key: 'overdue', overdue: true, tasks: late })
      if (today.length) groups.push({ key: todayKey, tasks: today })
      return { groups, done: done.filter((t) => t.due === todayKey) }
    }
    case 'week':
      return {
        groups: groupByDay(open.filter((t) => t.due >= todayKey && t.due <= weekEnd && !isOverdue(t, now))),
        done: done.filter((t) => t.due >= todayKey && t.due <= weekEnd),
      }
    case 'overdue':
      return { groups: groupByDay(open.filter((t) => isOverdue(t, now))), done: [] }
    case 'all':
      return { groups: groupByDay(open), done: done.reverse() }
  }
}

export function counts(all: Task[], todayKey: string, now: number) {
  let today = 0
  let overdue = 0
  for (const t of all) {
    if (t.done) continue
    if (isOverdue(t, now)) overdue++
    else if (t.due === todayKey) today++
  }
  return { today: today + overdue, overdue }
}
