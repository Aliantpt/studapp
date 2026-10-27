import type { Level, Profile } from './types'

// все слова, которые зависят от того, школа это или вуз
export type Terms = {
  levelName: string
  institution: string
  institutionPlaceholder: string
  yearLabel: string
  years: number[]
  groupLabel: string
  groupPlaceholder: string
  /** null — поле не показываем */
  majorLabel: string | null
  majorPlaceholder: string
  subjectLabel: string
  subjectPlaceholder: string
  taskPlaceholder: string
  plannerEmptyHint: string
  scheduleHint: string
  scannerHint: string
  assistantHint: string
  /** «урок» / «пара» */
  lesson: string
  /** «уроков» / «пар» */
  lessonsGen: string
  addLesson: string
  newLesson: string
  nextLesson: string
  nextLessonHint: string
  roomLabel: string
  roomPlaceholder: string
  teacherLabel: string
  teacherPlaceholder: string
  /** звонки по умолчанию: [начало, конец] */
  slots: [string, string][]
  /** у вуза есть лекции/семинары и чётные недели */
  hasKinds: boolean
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

export const terms: Record<Level, Terms> = {
  school: {
    levelName: 'Школа',
    institution: 'Школа',
    institutionPlaceholder: 'Школа № 57',
    yearLabel: 'Класс',
    years: range(11),
    groupLabel: 'Буква класса',
    groupPlaceholder: 'Б',
    majorLabel: null,
    majorPlaceholder: '',
    subjectLabel: 'Предмет',
    subjectPlaceholder: 'Алгебра',
    taskPlaceholder: 'Например, упр. 245 на с. 87',
    plannerEmptyHint: 'Запишите, что задали на дом, и планер напомнит о сроке.',
    scheduleHint: 'Здесь будут уроки на неделю: время, кабинет и учитель.',
    scannerHint: 'Здесь можно будет сфотографировать тетрадь или страницу учебника и сохранить её.',
    assistantHint: 'Помощник будет объяснять темы простыми словами, прямо на телефоне и без интернета.',
    lesson: 'урок',
    lessonsGen: 'уроков',
    addLesson: 'Добавить урок',
    newLesson: 'Новый урок',
    nextLesson: 'К следующему уроку',
    nextLessonHint: 'Следующий урок по этому предмету',
    roomLabel: 'Кабинет',
    roomPlaceholder: '214',
    teacherLabel: 'Учитель',
    teacherPlaceholder: 'Иванова М. П.',
    slots: [
      ['08:30', '09:15'],
      ['09:25', '10:10'],
      ['10:30', '11:15'],
      ['11:35', '12:20'],
      ['12:30', '13:15'],
      ['13:25', '14:10'],
      ['14:20', '15:05'],
      ['15:15', '16:00'],
    ],
    hasKinds: false,
  },
  uni: {
    levelName: 'ВУЗ',
    institution: 'Вуз',
    institutionPlaceholder: 'МГУ',
    yearLabel: 'Курс',
    years: range(6),
    groupLabel: 'Группа',
    groupPlaceholder: 'ИВТ-21',
    majorLabel: 'Направление',
    majorPlaceholder: 'Прикладная информатика',
    subjectLabel: 'Дисциплина',
    subjectPlaceholder: 'Матанализ',
    taskPlaceholder: 'Например, решить № 245–250',
    plannerEmptyHint: 'Запишите домашку, лабу или подготовку к семинару, и планер напомнит о сроке.',
    scheduleHint: 'Здесь будут пары на неделю: время, аудитория и преподаватель.',
    scannerHint: 'Здесь можно будет сфотографировать конспект лекции или страницу учебника и сохранить её.',
    assistantHint: 'Помощник будет разбирать сложные темы и помогать готовиться к сессии, прямо на телефоне и без интернета.',
    lesson: 'пара',
    lessonsGen: 'пар',
    addLesson: 'Добавить пару',
    newLesson: 'Новая пара',
    nextLesson: 'К следующей паре',
    nextLessonHint: 'Следующая пара по этой дисциплине',
    roomLabel: 'Аудитория',
    roomPlaceholder: '305 / корп. 2',
    teacherLabel: 'Преподаватель',
    teacherPlaceholder: 'Петров А. С.',
    slots: [
      ['09:00', '10:30'],
      ['10:40', '12:10'],
      ['12:40', '14:10'],
      ['14:20', '15:50'],
      ['16:00', '17:30'],
      ['17:40', '19:10'],
      ['19:20', '20:50'],
    ],
    hasKinds: true,
  },
}

/** при смене уровня чистим то, что к новому уровню не подходит */
export function switchLevel(profile: Profile, level: Level): Profile {
  if (profile.level === level) return profile
  const maxYear = terms[level].years.length
  return {
    ...profile,
    level,
    institution: '',
    year: profile.year && profile.year <= maxYear ? profile.year : null,
    group: '',
    major: level === 'uni' ? profile.major : '',
  }
}
