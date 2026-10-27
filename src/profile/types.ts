export type Level = 'school' | 'uni'

export type Profile = {
  level: Level
  name: string
  institution: string
  /** класс (1–11) или курс (1–6) */
  year: number | null
  /** буква класса или учебная группа */
  group: string
  /** направление / специальность, только для вуза */
  major: string
}

export function emptyProfile(level: Level): Profile {
  return { level, name: '', institution: '', year: null, group: '', major: '' }
}

export function cleanProfile(p: Profile): Profile {
  return { ...p, name: p.name.trim(), institution: p.institution.trim(), group: p.group.trim(), major: p.major.trim() }
}
