import { useCallback, useEffect, useState } from 'react'
import type { Lesson, LessonDraft } from './types'

const KEY = 'studapp.schedule.v1'

type Stored = { lessons: Lesson[]; flip: boolean }

export function loadSchedule(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { lessons: [], flip: false, ...(JSON.parse(raw) as Partial<Stored>) }
  } catch {
    // битые данные — начинаем с чистого листа
  }
  return { lessons: [], flip: false }
}

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useSchedule() {
  const [state, setState] = useState<Stored>(loadSchedule)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // нет места — живём в памяти
    }
  }, [state])

  const add = useCallback((draft: LessonDraft) => {
    setState((s) => ({ ...s, lessons: [...s.lessons, { ...draft, id: newId(), createdAt: Date.now() }] }))
  }, [])

  const update = useCallback((id: string, draft: LessonDraft) => {
    setState((s) => ({ ...s, lessons: s.lessons.map((l) => (l.id === id ? { ...l, ...draft } : l)) }))
  }, [])

  const remove = useCallback((id: string) => {
    setState((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== id) }))
  }, [])

  const restore = useCallback((lesson: Lesson) => {
    setState((s) => (s.lessons.some((l) => l.id === lesson.id) ? s : { ...s, lessons: [...s.lessons, lesson] }))
  }, [])

  const toggleFlip = useCallback(() => setState((s) => ({ ...s, flip: !s.flip })), [])

  return { lessons: state.lessons, flip: state.flip, add, update, remove, restore, toggleFlip }
}
