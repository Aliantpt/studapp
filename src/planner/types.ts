export type Priority = 'low' | 'normal' | 'high'

/** скан из раздела «Сканер» или файл, добавленный прямо в задание */
export type Attachment =
  | { kind: 'scan'; id: string }
  | { kind: 'file'; id: string; name: string; type: string; size: number }

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
  /** у старых заданий поля нет */
  attachments?: Attachment[]
}

export type TaskDraft = Omit<Task, 'id' | 'done' | 'createdAt' | 'remindedAt'>
