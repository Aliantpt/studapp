import { useState } from 'react'

// пока заглушки, первым прикрутим планер
const sections = [
  { id: 'planner', title: 'Планер', icon: '📝', text: 'Домашние задания, сроки и напоминания. Появится на следующем шаге.' },
  { id: 'schedule', title: 'Расписание', icon: '📅', text: 'Расписание пар на неделю. В планах.' },
  { id: 'scanner', title: 'Сканер', icon: '📷', text: 'Сканирование конспектов и учебных материалов. В планах.' },
  { id: 'assistant', title: 'Ассистент', icon: '🤖', text: 'ИИ-помощник, работающий прямо на устройстве. В планах.' },
] as const

type SectionId = (typeof sections)[number]['id']

function App() {
  const [active, setActive] = useState<SectionId>('planner')
  const current = sections.find((s) => s.id === active)!

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudApp</h1>
        <p>Помощник студента</p>
      </header>

      <main className="app-main">
        <div className="placeholder">
          <div className="placeholder-icon" aria-hidden="true">{current.icon}</div>
          <h2>{current.title}</h2>
          <p>{current.text}</p>
        </div>
      </main>

      <nav className="tabbar" aria-label="Разделы">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === active ? 'tab tab-active' : 'tab'}
            aria-current={s.id === active ? 'page' : undefined}
            onClick={() => setActive(s.id)}
          >
            <span className="tab-icon" aria-hidden="true">{s.icon}</span>
            <span className="tab-label">{s.title}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
