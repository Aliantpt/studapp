import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LevelPicker, ProfileFields } from './ProfileFields'
import { switchLevel } from './terms'
import { cleanProfile, emptyProfile, type Level, type Profile } from './types'

type Props = { onDone: (profile: Profile) => void }

type Step = 'hello' | 'level' | 'about'

export function Welcome({ onDone }: Props) {
  const [step, setStep] = useState<Step>('hello')
  const [profile, setProfile] = useState<Profile | null>(null)

  const pickLevel = (level: Level) => {
    setProfile((p) => (p ? switchLevel(p, level) : emptyProfile(level)))
  }

  const finish = (e?: FormEvent) => {
    e?.preventDefault()
    if (!profile) return
    onDone(cleanProfile(profile))
  }

  if (step === 'hello') {
    return (
      <div className="welcome welcome-hello">
        <div className="welcome-mark" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={72} height={72} />
        </div>
        <h1 className="welcome-title">StudApp</h1>
        <p className="welcome-lead">
          Домашка, расписание и конспекты в одном месте. Всё хранится только на вашем телефоне.
        </p>
        <button type="button" className="btn btn-primary btn-wide" onClick={() => setStep('level')}>
          Начать
        </button>
      </div>
    )
  }

  if (step === 'level') {
    return (
      <div className="welcome">
        <button type="button" className="welcome-back" aria-label="Назад" onClick={() => setStep('hello')}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="welcome-heading">Где вы учитесь?</h1>
        <p className="welcome-sub">От этого зависят названия в приложении и то, как будет объяснять ассистент.</p>
        <LevelPicker value={profile?.level ?? null} onChange={pickLevel} />
        <button
          type="button"
          className="btn btn-primary btn-wide welcome-next"
          disabled={!profile}
          onClick={() => setStep('about')}
        >
          Дальше
        </button>
      </div>
    )
  }

  return (
    <form className="welcome" onSubmit={finish}>
      <button type="button" className="welcome-back" aria-label="Назад" onClick={() => setStep('level')}>
        <ArrowLeft size={22} />
      </button>
      <h1 className="welcome-heading">Немного о себе</h1>
      <p className="welcome-sub">Всё необязательно, можно заполнить позже в профиле.</p>
      <div className="welcome-fields">{profile && <ProfileFields profile={profile} onChange={setProfile} />}</div>
      <div className="welcome-actions">
        <button type="submit" className="btn btn-primary btn-wide">
          Готово
        </button>
        <button type="button" className="btn btn-ghost btn-wide" onClick={() => finish()}>
          Пропустить
        </button>
      </div>
    </form>
  )
}
