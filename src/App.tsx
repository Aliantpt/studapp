import { useState } from 'react'
import { CalendarDays, MessagesSquare, NotebookPen, ScanLine, type LucideIcon } from 'lucide-react'

type Section = {
  id: string
  title: string
  icon: LucideIcon
  empty: string
  hint: string
}

// пока заглушки, первым прикрутим планер
const sections: Section[] = [
  {
    id: 'planner',
    title: 'Планер',
    icon: NotebookPen,
    empty: 'Заданий пока нет',
    hint: 'Скоро здесь можно будет записывать домашку со сроками и ставить напоминания.',
  },
  {
    id: 'schedule',
    title: 'Расписание',
    icon: CalendarDays,
    empty: 'Расписание не заполнено',
    hint: 'Здесь будут пары на неделю: время, аудитория и преподаватель.',
  },
  {
    id: 'scanner',
    title: 'Сканер',
    icon: ScanLine,
    empty: 'Сканов пока нет',
    hint: 'Здесь можно будет сфотографировать конспект или страницу учебника и сохранить её.',
  },
  {
    id: 'assistant',
    title: 'Ассистент',
    icon: MessagesSquare,
    empty: 'Ассистент в разработке',
    hint: 'Помощник будет отвечать на вопросы по учёбе прямо на телефоне, без интернета.',
  },
]

const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

function App() {
  const [activeId, setActiveId] = useState(sections[0].id)
  const active = sections.find((s) => s.id === activeId)!
  const [today] = useState(() => new Date())
  const ActiveIcon = active.icon

  return (
    <div className="app">
      <header className="today">
        <p className="today-weekday">{weekday.format(today)}</p>
        <h1 className="today-date">{dayMonth.format(today)}</h1>
      </header>

      <main className="screen">
        <h2 className="screen-title">{active.title}</h2>
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <ActiveIcon size={28} strokeWidth={1.75} />
          </span>
          <p className="empty-title">{active.empty}</p>
          <p className="empty-hint">{active.hint}</p>
        </div>
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
    </div>
  )
}

export default App
