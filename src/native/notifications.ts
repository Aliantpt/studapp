import { LocalNotifications } from '@capacitor/local-notifications'
import { remindAt } from '../planner/dates'
import type { Task } from '../planner/types'
import { isNative } from './platform'

// в приложении напоминания ставит сама iOS, поэтому они приходят даже при закрытом приложении.
// iOS держит максимум 64 запланированных уведомления, берём ближайшие
const LIMIT = 60

export function reminderBody(task: Task) {
  return [task.subject, task.time ? `срок в ${task.time}` : 'срок сегодня'].filter(Boolean).join(', ')
}

/** id уведомления должен быть числом, делаем его из id задания */
function numericId(id: string): number {
  let h = 0
  for (const ch of id) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0
  return Math.abs(h) || 1
}

export type NativeStatus = 'granted' | 'default' | 'denied'
let status: NativeStatus = 'default'

function toStatus(display: string): NativeStatus {
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default'
}

export const nativeStatus = () => status

if (isNative) {
  LocalNotifications.checkPermissions()
    .then((p) => (status = toStatus(p.display)))
    .catch(() => undefined)
}

export async function requestNative(): Promise<NativeStatus> {
  try {
    status = toStatus((await LocalNotifications.requestPermissions()).display)
  } catch {
    // плагин недоступен — оставляем как было
  }
  return status
}

let timer: number | undefined

/** перепланирует все напоминания под текущий список заданий */
export function syncNative(tasks: Task[]) {
  if (!isNative) return
  window.clearTimeout(timer)
  timer = window.setTimeout(() => void sync(tasks), 300)
}

async function sync(tasks: Task[]) {
  try {
    if (toStatus((await LocalNotifications.checkPermissions()).display) !== 'granted') return
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
    }
    const now = Date.now()
    const next = tasks
      .filter((t) => !t.done)
      .map((t) => ({ t, at: remindAt(t) }))
      .filter((x): x is { t: Task; at: number } => x.at !== null && x.at > now)
      .sort((a, b) => a.at - b.at)
      .slice(0, LIMIT)
    if (!next.length) return
    await LocalNotifications.schedule({
      notifications: next.map(({ t, at }) => ({
        id: numericId(t.id),
        title: t.title,
        body: reminderBody(t),
        schedule: { at: new Date(at), allowWhileIdle: true },
      })),
    })
  } catch {
    // не вышло — в следующий раз, при любом изменении заданий
  }
}
