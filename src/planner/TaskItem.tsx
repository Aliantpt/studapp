import { Bell, Check, Paperclip } from 'lucide-react'
import { dueLabel, isOverdue } from './dates'
import type { Task } from './types'

type Props = {
  task: Task
  todayKey: string
  now: number
  onToggle: (task: Task) => void
  onOpen: (task: Task) => void
  /** в группе по дням день уже в заголовке, показываем только время */
  timeOnly?: boolean
}

export function TaskItem({ task, todayKey, now, onToggle, onOpen, timeOnly = false }: Props) {
  const overdue = isOverdue(task, now)
  const due = timeOnly ? task.time : dueLabel(task, todayKey)
  const files = task.attachments?.length ?? 0

  return (
    <li className={task.done ? 'task task-done' : 'task'}>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Вернуть «${task.title}» в работу` : `Отметить «${task.title}» выполненным`}
        className="task-check"
        onClick={() => onToggle(task)}
      >
        <Check size={16} strokeWidth={3} />
      </button>

      <button type="button" className="task-body" onClick={() => onOpen(task)}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.priority === 'high' && !task.done && <span className="task-flag">Важно</span>}
          {task.subject && <span className="task-subject">{task.subject}</span>}
          {due && <span className={overdue ? 'task-due task-due-late' : 'task-due'}>{due}</span>}
          {task.remind !== null && !task.done && <Bell size={14} aria-label="С напоминанием" />}
          {files > 0 && (
            <span className="task-files" aria-label={`Вложений: ${files}`}>
              <Paperclip size={14} aria-hidden="true" />
              {files}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
