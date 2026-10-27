export type LessonKind = 'lecture' | 'seminar' | 'lab' | 'practice'

/** all — каждую неделю, odd/even — только по нечётным / чётным */
export type WeekRule = 'all' | 'odd' | 'even'

export type Lesson = {
  id: string
  /** 1 — понедельник … 7 — воскресенье */
  day: number
  /** HH:MM */
  start: string
  end: string
  subject: string
  room: string
  teacher: string
  kind: LessonKind | null
  week: WeekRule
  createdAt: number
}

export type LessonDraft = Omit<Lesson, 'id' | 'createdAt'>

export const kindLabels: Record<LessonKind, string> = {
  lecture: 'Лекция',
  seminar: 'Семинар',
  lab: 'Лаба',
  practice: 'Практика',
}

export const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
