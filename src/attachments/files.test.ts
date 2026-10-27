import { describe, expect, it } from 'vitest'
import type { Task } from '../planner/types'
import { extLabel, sizeLabel } from './files'
import { linkedTo } from './links'

const task = (attachments?: Task['attachments']): Task => ({
  id: 't',
  title: 'Реферат',
  subject: 'История',
  due: '2026-10-28',
  time: null,
  priority: 'normal',
  remind: null,
  note: '',
  done: false,
  createdAt: 0,
  remindedAt: null,
  attachments,
})

describe('вложения', () => {
  it('понимает, к какому заданию прикреплён скан', () => {
    expect(linkedTo(task([{ kind: 'scan', id: 's1' }]), 's1')).toBe(true)
    expect(linkedTo(task([{ kind: 'file', id: 's1', name: 'a.pdf', type: 'application/pdf', size: 1 }]), 's1')).toBe(false)
    // старые задания без поля
    expect(linkedTo(task(), 's1')).toBe(false)
  })

  it('подписывает размер и тип файла по-русски', () => {
    expect(sizeLabel(500)).toBe('500 Б')
    expect(sizeLabel(2048)).toBe('2 КБ')
    expect(sizeLabel(3.4 * 1024 * 1024)).toBe('3,4 МБ')
    expect(extLabel('лаба 3.docx')).toBe('DOCX')
    expect(extLabel('без расширения')).toBe('Файл')
  })
})
