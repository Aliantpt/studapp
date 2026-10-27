import { useCallback, useEffect, useState } from 'react'
import { syncNative } from '../native/notifications'
import type { Task, TaskDraft } from './types'

const KEY = 'studapp.tasks.v1'

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Task[]) : []
  } catch {
    return []
  }
}

function save(tasks: Task[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks))
  } catch {
    // переполнено или приватный режим — живём в памяти
  }
}

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    save(tasks)
    syncNative(tasks)
  }, [tasks])

  // синк между вкладками
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setTasks(loadTasks())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((draft: TaskDraft) => {
    const task: Task = { ...draft, id: newId(), done: false, createdAt: Date.now(), remindedAt: null }
    setTasks((list) => [...list, task])
    return task
  }, [])

  const update = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const remove = useCallback((id: string) => {
    setTasks((list) => list.filter((t) => t.id !== id))
  }, [])

  const restore = useCallback((task: Task) => {
    setTasks((list) => (list.some((t) => t.id === task.id) ? list : [...list, task]))
  }, [])

  return { tasks, add, update, remove, restore }
}
