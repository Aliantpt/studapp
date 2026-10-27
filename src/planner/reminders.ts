import { useEffect, useRef } from 'react'
import { remindAt } from './dates'
import { isNative } from '../native/platform'
import { nativeStatus, reminderBody, requestNative, syncNative } from '../native/notifications'
import { loadTasks } from './storage'
import type { Task } from './types'

// пропущенное напоминание показываем, только если опоздали не сильно
const LATE_GRACE = 30 * 60_000
const TICK = 15_000

export type NotifyStatus = 'granted' | 'default' | 'denied' | 'unsupported'

export function notifyStatus(): NotifyStatus {
  if (isNative) return nativeStatus()
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  return Notification.permission
}

export async function askPermission(): Promise<NotifyStatus> {
  if (isNative) {
    const status = nativeStatus() === 'default' ? await requestNative() : nativeStatus()
    // разрешили только что — ставим напоминания, которые до этого не ставились
    if (status === 'granted') syncNative(loadTasks())
    return status
  }
  const status = notifyStatus()
  if (status !== 'default') return status
  try {
    return await Notification.requestPermission()
  } catch {
    return notifyStatus()
  }
}

/** просим разрешение на уведомления; если не вышло — текст для тоста */
export async function permissionProblem(): Promise<string | null> {
  const status = await askPermission()
  if (status === 'unsupported') return 'Чтобы приходили напоминания, установите приложение на главный экран'
  if (status === 'denied') return 'Уведомления выключены в настройках браузера, напоминание не придёт'
  return null
}

async function show(task: Task) {
  const body = reminderBody(task)
  const options: NotificationOptions = {
    body,
    tag: task.id,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icon-192.png`,
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) return await reg.showNotification(task.title, options)
    new Notification(task.title, options)
  } catch {
    // уведомления недоступны, задача и так видна в списке
  }
}

/** раз в TICK проверяет, кому пора напомнить */
export function useReminders(tasks: Task[], markReminded: (id: string, at: number) => void) {
  const latest = useRef({ tasks, markReminded })
  useEffect(() => {
    latest.current = { tasks, markReminded }
  })

  useEffect(() => {
    // в приложении напоминания расписывает iOS, см. native/notifications
    if (isNative) return
    const check = () => {
      if (notifyStatus() !== 'granted') return
      const now = Date.now()
      for (const task of latest.current.tasks) {
        if (task.done) continue
        const at = remindAt(task)
        if (at === null || at > now || task.remindedAt === at) continue
        if (now - at < LATE_GRACE) void show(task)
        latest.current.markReminded(task.id, at)
      }
    }
    check()
    const timer = window.setInterval(check, TICK)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
}
