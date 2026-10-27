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
