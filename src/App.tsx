import { useEffect, useState } from 'react'
import { CalendarDays, MessagesSquare, NotebookPen, ScanLine, UserRound, type LucideIcon } from 'lucide-react'
import { toDateKey } from './planner/dates'
import { PlannerScreen } from './planner/PlannerScreen'
import { TermsContext } from './profile/context'
import { ScheduleScreen } from './schedule/ScheduleScreen'
import { ProfileSheet } from './profile/ProfileSheet'
import { useProfileState } from './profile/storage'
import { terms, type Terms } from './profile/terms'
import type { Profile } from './profile/types'
import { Welcome } from './profile/Welcome'

type Section = {
  id: string
  title: string
  icon: LucideIcon
  empty: string
  hint: (t: Terms) => string
}

// планер и расписание готовы, остальное пока заглушки
const sections: Section[] = [
  {
    id: 'planner',
    title: 'Планер',
    icon: NotebookPen,
    empty: 'Заданий пока нет',
    hint: (t) => t.plannerEmptyHint,
  },
  {
    id: 'schedule',
    title: 'Расписание',
    icon: CalendarDays,
    empty: 'Расписание не заполнено',
    hint: (t) => t.scheduleHint,
  },
  {
    id: 'scanner',
    title: 'Сканер',
    icon: ScanLine,
    empty: 'Сканов пока нет',
    hint: (t) => t.scannerHint,
  },
  {
    id: 'assistant',
    title: 'Ассистент',
    icon: MessagesSquare,
    empty: 'Ассистент в разработке',
    hint: (t) => t.assistantHint,
  },
]

const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

// текущее время, обновляется раз в 30 секунд и при возврате в приложение
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return now
}

function App() {
  const { profile, save } = useProfileState()
  if (!profile) return <Welcome onDone={save} />
  return <Main profile={profile} onSaveProfile={save} />
}

type MainProps = {
  profile: Profile
  onSaveProfile: (profile: Profile) => void
}

function Main({ profile, onSaveProfile }: MainProps) {
  const [activeId, setActiveId] = useState(sections[0].id)
  const [profileOpen, setProfileOpen] = useState(false)
  const t = terms[profile.level]
  const active = sections.find((s) => s.id === activeId)!
  const now = useNow()
  const today = new Date(now)
  const ActiveIcon = active.icon

  return (
    <TermsContext.Provider value={t}>
      <div className="app">
        <header className="today">
          <p className="today-weekday">{weekday.format(today)}</p>
          <h1 className="today-date">{dayMonth.format(today)}</h1>
          <button type="button" className="avatar" aria-label="Профиль" onClick={() => setProfileOpen(true)}>
            {profile.name ? profile.name[0].toUpperCase() : <UserRound size={22} />}
          </button>
        </header>

        <main className="screen">
          <h2 className="screen-title">{active.title}</h2>
          {active.id === 'planner' ? (
            <PlannerScreen todayKey={toDateKey(today)} now={now} />
          ) : active.id === 'schedule' ? (
            <ScheduleScreen todayKey={toDateKey(today)} now={now} />
          ) : (
            <div className="empty">
              <span className="empty-icon" aria-hidden="true">
                <ActiveIcon size={28} strokeWidth={1.75} />
              </span>
              <p className="empty-title">{active.empty}</p>
              <p className="empty-hint">{active.hint(t)}</p>
            </div>
          )}
        </main>

        <nav className="tabbar" aria-label="Разделы">
          {sections.map(({ id, title, icon: Icon }) => {
            const isActive = id === activeId
            return (
              <button
                key={id}
                type="button"
                className="tab"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveId(id)}
              >
                <span className="tab-pill">
                  <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                <span className="tab-label">{title}</span>
              </button>
            )
          })}
        </nav>

        <ProfileSheet
          open={profileOpen}
          profile={profile}
          onSave={(p) => {
            onSaveProfile(p)
            setProfileOpen(false)
          }}
          onClose={() => setProfileOpen(false)}
        />
      </div>
    </TermsContext.Provider>
  )
}

export default App
