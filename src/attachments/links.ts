import type { Task } from '../planner/types'

export function linkedTo(task: Task, scanId: string) {
  return task.attachments?.some((a) => a.kind === 'scan' && a.id === scanId) ?? false
}
