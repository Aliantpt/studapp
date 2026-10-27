import { describe, expect, it } from 'vitest'
import { addDays, dayLabel, dueLabel, remindAt } from './dates'
import type { Task } from './types'
import { buildView, counts } from './views'

const today = '2026-10-27'
// вторник, 12:00
const now = new Date(2026, 9, 27, 12, 0).getTime()

let seq = 0
function task(patch: Partial<Task>): Task {
  seq++
  return {
    id: String(seq),
    title: `t${seq}`,
    subject: '',
    due: today,
    time: null,
    priority: 'normal',
    remind: null,
    note: '',
    done: false,
    createdAt: seq,
    remindedAt: null,
    ...patch,
  }
}

describe('dates', () => {
  it('сдвигает даты через границу месяца', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('подписывает ближние дни словами', () => {
    expect(dayLabel(today, today)).toBe('Сегодня')
    expect(dayLabel('2026-10-28', today)).toBe('Завтра')
    expect(dayLabel('2026-10-26', today)).toBe('Вчера')
    expect(dayLabel('2026-10-30', today)).toMatch(/30 октября/)
    expect(dueLabel({ due: '2026-10-28', time: '09:30' }, today)).toBe('завтра, 09:30')
  })

  it('считает напоминание от времени или от 9 утра', () => {
    expect(remindAt({ due: today, time: '18:00', remind: 60 })).toBe(new Date(2026, 9, 27, 17, 0).getTime())
    expect(remindAt({ due: today, time: null, remind: 0 })).toBe(new Date(2026, 9, 27, 9, 0).getTime())
    expect(remindAt({ due: today, time: null, remind: null })).toBeNull()
  })
})

describe('views', () => {
  const late = task({ due: '2026-10-26' })
  const morning = task({ due: today, time: '10:00' })
  const evening = task({ due: today, time: '18:00' })
  const noTime = task({ due: today })
  const friday = task({ due: '2026-10-30' })
  const nextMonth = task({ due: '2026-11-20' })
  const doneToday = task({ due: today, done: true })
  const all = [nextMonth, friday, doneToday, noTime, evening, morning, late]

  it('сегодня: сначала просроченные, потом сегодняшние по времени', () => {
    const v = buildView('today', all, today, now)
    expect(v.groups.map((g) => g.key)).toEqual(['overdue', today])
    expect(v.groups[0].tasks).toEqual([late, morning])
    expect(v.groups[1].tasks).toEqual([evening, noTime])
    expect(v.done).toEqual([doneToday])
  })

  it('неделя: семь дней вперёд, сгруппировано по дням', () => {
    const v = buildView('week', all, today, now)
    expect(v.groups.map((g) => g.key)).toEqual([today, '2026-10-30'])
  })

  it('просрочено и счётчики', () => {
    expect(buildView('overdue', all, today, now).groups.flatMap((g) => g.tasks)).toEqual([late, morning])
    expect(counts(all, today, now)).toEqual({ today: 4, overdue: 2 })
  })

  it('все: открытые задания по датам', () => {
    const v = buildView('all', all, today, now)
    expect(v.groups.map((g) => g.key)).toEqual(['2026-10-26', today, '2026-10-30', '2026-11-20'])
  })
})
