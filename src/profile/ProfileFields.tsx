import { GraduationCap, School } from 'lucide-react'
import { terms } from './terms'
import type { Level, Profile } from './types'

type Props = {
  profile: Profile
  onChange: (profile: Profile) => void
}

/** поля «о себе», общие для приветствия и редактирования профиля */
export function ProfileFields({ profile, onChange }: Props) {
  const t = terms[profile.level]
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value })

  return (
    <>
      <label className="field">
        <span className="field-label">Как к вам обращаться</span>
        <input
          className="input"
          value={profile.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Имя"
          autoComplete="given-name"
          autoCapitalize="words"
        />
      </label>

      <label className="field">
        <span className="field-label">{t.institution}</span>
        <input
          className="input"
          value={profile.institution}
          onChange={(e) => set('institution', e.target.value)}
          placeholder={t.institutionPlaceholder}
        />
      </label>

      <fieldset className="field">
        <legend className="field-label">{t.yearLabel}</legend>
        <div className="chips chips-wrap">
          {t.years.map((y) => (
            <button
              key={y}
              type="button"
              className="chip chip-num"
              aria-pressed={profile.year === y}
              onClick={() => set('year', profile.year === y ? null : y)}
            >
              {y}
            </button>
          ))}
        </div>
      </fieldset>

      {t.majorLabel && (
        <label className="field">
          <span className="field-label">{t.majorLabel}</span>
          <input
            className="input"
            value={profile.major}
            onChange={(e) => set('major', e.target.value)}
            placeholder={t.majorPlaceholder}
          />
        </label>
      )}

      <label className="field">
        <span className="field-label">{t.groupLabel}</span>
        <input
          className="input"
          value={profile.group}
          onChange={(e) => set('group', e.target.value)}
          placeholder={t.groupPlaceholder}
          autoCapitalize="characters"
        />
      </label>
    </>
  )
}

const levels: { value: Level; title: string; text: string; icon: typeof School }[] = [
  { value: 'school', title: 'Школа', text: 'Уроки, классы, домашка', icon: School },
  { value: 'uni', title: 'ВУЗ', text: 'Пары, курсы, сессия', icon: GraduationCap },
]

type LevelProps = {
  value: Level | null
  onChange: (level: Level) => void
}

/** две большие карточки выбора: школа или вуз */
export function LevelPicker({ value, onChange }: LevelProps) {
  return (
    <div className="levels" role="radiogroup" aria-label="Где вы учитесь">
      {levels.map(({ value: v, title, text, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          className="level"
          onClick={() => onChange(v)}
        >
          <span className="level-icon" aria-hidden="true">
            <Icon size={28} strokeWidth={1.75} />
          </span>
          <span className="level-title">{title}</span>
          <span className="level-text">{text}</span>
        </button>
      ))}
    </div>
  )
}
