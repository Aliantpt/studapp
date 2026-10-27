import { describe, expect, it } from 'vitest'
import type { Lesson } from './types'
import { isoWeek, isOddWeek, lessonsOn, mondayOf, nextOccurrence, progress, weekday } from './week'

let seq = 0
function lesson(patch: Partial<Lesson>): Lesson {
  seq++
  return {
    id: String(seq),
    day: 1,
    start: '09:00',
    end: '10:30',
    subject: 'Матанализ',
    room: '',
    teacher: '',
    kind: null,
    week: 'all',
    createdAt: seq,
    ...patch,
  }
}

describe('неделя', () => {
  it('дни недели с понедельника', () => {
    expect(weekday('2026-10-26')).toBe(1)
    expect(weekday('2026-11-01')).toBe(7)
    expect(mondayOf('2026-11-01')).toBe('2026-10-26')
    expect(mondayOf('2026-10-26')).toBe('2026-10-26')
  })

  it('номер недели по ISO', () => {
    expect(isoWeek('2026-01-01')).toBe(1)
    expect(isoWeek('2025-12-29')).toBe(1)
    expect(isoWeek('2026-10-27')).toBe(44)
    expect(isoWeek('2027-01-01')).toBe(53)
  })

  it('чётность и переключатель', () => {
    expect(isOddWeek('2026-10-27', false)).toBe(false)
    expect(isOddWeek('2026-10-27', true)).toBe(true)
    expect(isOddWeek('2026-11-03', false)).toBe(true)
  })
})

describe('занятия', () => {
  const mon = lesson({ day: 1, start: '10:40', end: '12:10' })
  const monEarly = lesson({ day: 1, start: '09:00' })
  const tueOdd = lesson({ day: 2, week: 'odd', subject: 'Физика' })
  const tueEven = lesson({ day: 2, week: 'even', subject: 'Физика', start: '12:40', end: '14:10' })
  const all = [mon, tueOdd, monEarly, tueEven]

  it('по дням, по времени и по чётности', () => {
    expect(lessonsOn(all, '2026-10-26', false)).toEqual([monEarly, mon])
    expect(lessonsOn(all, '2026-10-27', false)).toEqual([tueEven])
    expect(lessonsOn(all, '2026-11-03', false)).toEqual([tueOdd])
  })

  it('следующее занятие по предмету', () => {
    // вторник 27.10, 11:00 — чётная неделя
    const now = new Date(2026, 9, 27, 11, 0)
    expect(nextOccurrence(all, 'физика', now, false)).toEqual({ due: '2026-10-27', time: '12:40' })
    const afterLesson = new Date(2026, 9, 27, 13, 0)
    expect(nextOccurrence(all, 'Физика', afterLesson, false)).toEqual({ due: '2026-11-03', time: '09:00' })
    expect(nextOccurrence(all, 'Матанализ', afterLesson, false)).toEqual({ due: '2026-11-02', time: '09:00' })
    expect(nextOccurrence(all, 'История', now, false)).toBeNull()
    expect(nextOccurrence(all, '', now, false)).toBeNull()
  })

  it('прогресс текущего занятия', () => {
    expect(progress(mon, '11:25')).toBeCloseTo(0.5)
    expect(progress(mon, '10:39')).toBeNull()
    expect(progress(mon, '12:10')).toBeNull()
  })
})
