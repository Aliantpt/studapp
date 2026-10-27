import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, NotebookPen, Plus } from 'lucide-react'
import { dayLabel, remindAt } from './dates'
import { askPermission, notifyStatus, useReminders } from './reminders'
import { useTasks } from './storage'
import { useTerms } from '../profile/context'
import { TaskItem } from './TaskItem'
import { TaskSheet } from './TaskSheet'
import type { Task, TaskDraft } from './types'
import { buildView, counts, type ViewId } from './views'

type Toast = { text: string; undo?: () => void }

const views: { id: ViewId; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'overdue', label: 'Просрочено' },
  { id: 'all', label: 'Все' },
]

const emptyText: Record<ViewId, { title: string; hint: string | null }> = {
  // null — подставим подсказку под школу или вуз
  today: { title: 'На сегодня всё чисто', hint: null },
  week: { title: 'На неделю ничего нет', hint: 'Задания на ближайшие семь дней появятся здесь.' },
  overdue: { title: 'Просроченных нет', hint: 'Всё сдано вовремя.' },
  all: { title: 'Заданий пока нет', hint: 'Добавьте первое задание, чтобы начать.' },
}

type Props = { todayKey: string; now: number }

export function PlannerScreen({ todayKey, now }: Props) {
  const { tasks, add, update, remove, restore } = useTasks()
  const [view, setView] = useState<ViewId>('today')
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const terms = useTerms()

  const markReminded = useCallback((id: string, at: number) => update(id, { remindedAt: at }), [update])
  useReminders(tasks, markReminded)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const data = useMemo(() => buildView(view, tasks, todayKey, now), [view, tasks, todayKey, now])
  const badge = useMemo(() => counts(tasks, todayKey, now), [tasks, todayKey, now])
  const subjects = useMemo(
    () => [...new Set(tasks.map((t) => t.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')),
    [tasks],
  )

  const toggle = (task: Task) => {
    update(task.id, { done: !task.done })
    if (!task.done) setToast({ text: 'Задание выполнено', undo: () => update(task.id, { done: false }) })
  }

  const save = async (draft: TaskDraft) => {
    const wasEditing = editing
    setEditing(null)

    if (wasEditing && wasEditing !== 'new') {
      // поменяли срок или напоминание — напомним заново
      const timingChanged = remindAt(wasEditing) !== remindAt(draft)
      update(wasEditing.id, { ...draft, ...(timingChanged ? { remindedAt: null } : {}) })
    } else {
      add(draft)
    }

    if (draft.remind !== null) {
      const status = await askPermission()
      if (status === 'unsupported') {
        setToast({ text: 'Чтобы приходили напоминания, установите приложение на главный экран' })
      } else if (status === 'denied') {
        setToast({ text: 'Уведомления выключены в настройках браузера, напоминание не придёт' })
      }
    }
  }

  const del = (task: Task) => {
    setEditing(null)
    remove(task.id)
    setToast({ text: 'Задание удалено', undo: () => restore(task) })
  }

  const empty = data.groups.length === 0
  const notifyOff = notifyStatus() === 'denied' && tasks.some((t) => !t.done && t.remind !== null)

  return (
    <>
      <div className="filters" role="tablist" aria-label="Какие задания показать">
        {views.map((v) => {
          const n = v.id === 'today' ? badge.today : v.id === 'overdue' ? badge.overdue : 0
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              className={v.id === 'overdue' && n > 0 ? 'filter filter-alert' : 'filter'}
              onClick={() => setView(v.id)}
            >
              {v.label}
              {n > 0 && <span className="filter-count">{n}</span>}
            </button>
          )
        })}
      </div>

      {notifyOff && <p className="notice">Уведомления выключены, поэтому напоминания не придут.</p>}

      {empty ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <NotebookPen size={28} strokeWidth={1.75} />
          </span>
          <p className="empty-title">{emptyText[view].title}</p>
          <p className="empty-hint">{emptyText[view].hint ?? terms.plannerEmptyHint}</p>
          {view !== 'overdue' && (
            <button type="button" className="btn btn-primary empty-action" onClick={() => setEditing('new')}>
              Добавить задание
            </button>
          )}
        </div>
      ) : (
        data.groups.map((g) => (
          <section key={g.key} className="group">
            <h3 className={g.overdue ? 'group-title group-title-late' : 'group-title'}>
              {g.overdue ? 'Просрочено' : dayLabel(g.key, todayKey)}
            </h3>
            <ul className="tasks">
              {g.tasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  todayKey={todayKey}
                  now={now}
                  onToggle={toggle}
                  onOpen={setEditing}
                  timeOnly={!g.overdue}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {data.done.length > 0 && (
        <section className="group">
          <button
            type="button"
            className="done-toggle"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
          >
            Выполнено: {data.done.length}
            <ChevronDown size={18} className="done-chevron" />
          </button>
          {showDone && (
            <ul className="tasks">
              {data.done.map((t) => (
                <TaskItem key={t.id} task={t} todayKey={todayKey} now={now} onToggle={toggle} onOpen={setEditing} />
              ))}
            </ul>
          )}
        </section>
      )}

      <button type="button" className="fab" aria-label="Новое задание" onClick={() => setEditing('new')}>
        <Plus size={28} strokeWidth={2.25} />
      </button>

      <TaskSheet
        editing={editing}
        todayKey={todayKey}
        subjects={subjects}
        onSave={save}
        onDelete={del}
        onClose={() => setEditing(null)}
      />

      <div className="toast-slot" aria-live="polite">
        {toast && (
          <div className="toast">
            <span>{toast.text}</span>
            {toast.undo && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.undo?.()
                  setToast(null)
                }}
              >
                Вернуть
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
