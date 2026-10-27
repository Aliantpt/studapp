import { describe, expect, it } from 'vitest'
import { lessonsOn, monthGrid, tasksByLesson, mondayOf, nextOccurrence, occursOn, progress, suggestTime, weekday } from './calendar'
import type { Task } from '../planner/types'
import type { Lesson } from './types'

let seq = 0
function lesson(patch: Partial<Lesson>): Lesson {
  seq++
  return {
    id: String(seq),
    date: '2026-10-27',
    start: '09:00',
    end: '10:30',
    subject: 'Матанализ',
    room: '',
    teacher: '',
    kind: null,
    repeat: 'none',
    skip: [],
    createdAt: seq,
    ...patch,
  }
}

describe('календарь', () => {
  it('дни недели с понедельника', () => {
    expect(weekday('2026-10-26')).toBe(1)
    expect(weekday('2026-11-01')).toBe(7)
    expect(mondayOf('2026-11-01')).toBe('2026-10-26')
  })

  it('сетка месяца — целые недели с понедельника', () => {
    const oct = monthGrid(2026, 9)
    expect(oct[0]).toBe('2026-09-28')
    expect(oct.at(-1)).toBe('2026-11-01')
    expect(oct.length % 7).toBe(0)
    // февраль 2027 начинается в понедельник и занимает ровно 4 недели
    expect(monthGrid(2027, 1)).toHaveLength(28)
  })
})

describe('занятия', () => {
  const once = lesson({ date: '2026-10-27', start: '10:40', end: '12:10' })
  const weekly = lesson({ date: '2026-10-27', subject: 'Физика', repeat: 'weekly', skip: ['2026-11-10'] })
  const all = [once, weekly]

  it('разовые и повторы', () => {
    expect(occursOn(once, '2026-10-27')).toBe(true)
    expect(occursOn(once, '2026-11-03')).toBe(false)
    expect(occursOn(weekly, '2026-10-20')).toBe(false)
    expect(occursOn(weekly, '2026-11-03')).toBe(true)
    expect(occursOn(weekly, '2026-11-04')).toBe(false)
    expect(occursOn(weekly, '2026-11-10')).toBe(false)
    expect(lessonsOn(all, '2026-10-27')).toEqual([weekly, once])
  })

  it('следующее занятие по предмету', () => {
    const morning = new Date(2026, 9, 27, 8, 0)
    const evening = new Date(2026, 9, 27, 18, 0)
    expect(nextOccurrence(all, 'физика', morning)).toEqual({ due: '2026-10-27', time: '09:00' })
    expect(nextOccurrence(all, 'Физика', evening)).toEqual({ due: '2026-11-03', time: '09:00' })
    expect(nextOccurrence(all, 'Матанализ', evening)).toBeNull()
    expect(nextOccurrence(all, '', morning)).toBeNull()
  })

  it('время новой пары после последней', () => {
    expect(suggestTime([], ['09:00', '10:30'])).toEqual(['09:00', '10:30'])
    expect(suggestTime([once], ['09:00', '10:30'])).toEqual(['12:20', '13:50'])
  })

  it('прогресс текущего занятия', () => {
    expect(progress(once, '11:25')).toBeCloseTo(0.5)
    expect(progress(once, '12:10')).toBeNull()
  })
})

describe('задания у пар', () => {
  const task = (patch: Partial<Task>): Task => ({
    id: String(++seq),
    title: 't',
    subject: 'Физика',
    due: '2026-10-27',
    time: null,
    priority: 'normal',
    remind: null,
    note: '',
    done: false,
    createdAt: seq,
    remindedAt: null,
    ...patch,
  })
  const phys1 = lesson({ subject: 'Физика', start: '09:00' })
  const phys2 = lesson({ subject: 'физика ', start: '12:40', end: '14:10' })
  const math = lesson({ subject: 'Матанализ', start: '10:40', end: '12:10' })
  const day = [phys1, math, phys2]

  it('по предмету и дате, с учётом времени', () => {
    const a = task({})
    const b = task({ time: '12:40' })
    const other = task({ subject: 'История' })
    const tomorrow = task({ due: '2026-10-28' })
    const map = tasksByLesson(day, [a, b, other, tomorrow], '2026-10-27')
    expect(map.get(phys1.id)).toEqual([a])
    expect(map.get(phys2.id)).toEqual([b])
    expect(map.has(math.id)).toBe(false)
  })
})
