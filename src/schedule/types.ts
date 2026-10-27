export type LessonKind = 'lecture' | 'seminar' | 'lab' | 'practice'

export type Lesson = {
  id: string
  /** YYYY-MM-DD — день занятия, для повторов — первый день серии */
  date: string
  /** HH:MM */
  start: string
  end: string
  subject: string
  room: string
  teacher: string
  kind: LessonKind | null
  /** weekly — повторять каждую неделю в тот же день */
  repeat: 'none' | 'weekly'
  /** дни, которые удалили из серии повторов */
  skip: string[]
  createdAt: number
}

export type LessonDraft = Omit<Lesson, 'id' | 'createdAt' | 'skip'>

export const kindLabels: Record<LessonKind, string> = {
  lecture: 'Лекция',
  seminar: 'Семинар',
  lab: 'Лаба',
  practice: 'Практика',
}

export const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
