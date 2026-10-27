import { useCallback, useEffect, useState } from 'react'
import { addDays, toDateKey } from '../planner/dates'
import type { Lesson, LessonDraft } from './types'

const KEY = 'studapp.schedule.v2'
const OLD_KEY = 'studapp.schedule.v1'

type OldLesson = Omit<Lesson, 'date' | 'repeat' | 'skip'> & { day: number }

// первая версия хранила пары по дням недели с чёт/нечет — превращаем их в еженедельные повторы с этой недели
function migrate(): Lesson[] {
  try {
    const raw = localStorage.getItem(OLD_KEY)
    if (!raw) return []
    const today = new Date()
    const monday = addDays(toDateKey(today), 1 - (today.getDay() || 7))
    const old = (JSON.parse(raw) as { lessons?: OldLesson[] }).lessons ?? []
    return old.map(({ day, ...rest }) => ({
      ...rest,
      date: addDays(monday, day - 1),
      repeat: 'weekly',
      skip: [],
    }))
  } catch {
    return []
  }
}

export function loadSchedule(): Lesson[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Lesson[]
  } catch {
    // битые данные — начинаем с чистого листа
  }
  return migrate()
}

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useSchedule() {
  const [lessons, setLessons] = useState<Lesson[]>(loadSchedule)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lessons))
    } catch {
      // нет места — живём в памяти
    }
  }, [lessons])

  const add = useCallback((draft: LessonDraft) => {
    setLessons((list) => [...list, { ...draft, id: newId(), skip: [], createdAt: Date.now() }])
  }, [])

  const update = useCallback((id: string, draft: LessonDraft) => {
    setLessons((list) => list.map((l) => (l.id === id ? { ...l, ...draft } : l)))
  }, [])

  const remove = useCallback((id: string) => {
    setLessons((list) => list.filter((l) => l.id !== id))
  }, [])

  /** убрать из серии повторов один день */
  const skipDay = useCallback((id: string, key: string) => {
    setLessons((list) => list.map((l) => (l.id === id ? { ...l, skip: [...l.skip, key] } : l)))
  }, [])

  const unskipDay = useCallback((id: string, key: string) => {
    setLessons((list) => list.map((l) => (l.id === id ? { ...l, skip: l.skip.filter((k) => k !== key) } : l)))
  }, [])

  const restore = useCallback((lesson: Lesson) => {
    setLessons((list) => (list.some((l) => l.id === lesson.id) ? list : [...list, lesson]))
  }, [])

  return { lessons, add, update, remove, skipDay, unskipDay, restore }
}
