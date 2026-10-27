export type Priority = 'low' | 'normal' | 'high'

export type Task = {
  id: string
  title: string
  subject: string
  /** YYYY-MM-DD */
  due: string
  /** HH:MM, если не задано — просто «к этому дню» */
  time: string | null
  priority: Priority
  /** за сколько минут до срока напомнить, null — без напоминания */
  remind: number | null
  note: string
  done: boolean
  createdAt: number
  /** момент напоминания, на который уже отправили уведомление */
  remindedAt: number | null
}

export type TaskDraft = Omit<Task, 'id' | 'done' | 'createdAt' | 'remindedAt'>
