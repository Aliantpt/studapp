import type { Attachment, Task } from '../planner/types'
import { askPersist, run } from '../scanner/db'
import { loadImage, toJpeg } from '../scanner/image'

type Stored = { id: string; blob: Blob; createdAt: number }
export type FileAttachment = Extract<Attachment, { kind: 'file' }>

export const MAX_FILE = 30 * 1024 * 1024

export const filesDb = {
  get: (id: string) =>
    run<Stored | undefined>('files', 'readonly', (s) => s.get(id) as IDBRequest<Stored | undefined>).then(
      (f) => f?.blob,
    ),
  put: (file: Stored) => run('files', 'readwrite', (s) => s.put(file)),
  keys: () => run<IDBValidKey[]>('files', 'readonly', (s) => s.getAllKeys()),
  remove: (id: string) => run('files', 'readwrite', (s) => s.delete(id)),
}

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// фотки с камеры весят по 5–10 МБ, для домашки хватит и 2400px
const shrinkable = /^image\/(jpeg|png|webp|heic|heif)$/

async function shrink(file: File): Promise<{ blob: Blob; name: string; type: string }> {
  if (!shrinkable.test(file.type)) return { blob: file, name: file.name, type: file.type }
  try {
    const blob = await toJpeg(await loadImage(file))
    if (blob.size >= file.size) return { blob: file, name: file.name, type: file.type }
    return { blob, name: file.name.replace(/\.\w+$/, '') + '.jpg', type: 'image/jpeg' }
  } catch {
    // браузер не умеет этот формат — храним как есть
    return { blob: file, name: file.name, type: file.type }
  }
}

/** кладёт выбранные файлы в базу, возвращает вложения и имена тех, что не влезли */
export async function storeFiles(files: File[]): Promise<{ added: FileAttachment[]; tooBig: string[] }> {
  const added: FileAttachment[] = []
  const tooBig: string[] = []
  for (const file of files) {
    if (file.size > MAX_FILE) {
      tooBig.push(file.name)
      continue
    }
    const { blob, name, type } = await shrink(file)
    const id = newId()
    await filesDb.put({ id, blob, createdAt: Date.now() })
    added.push({ kind: 'file', id, name: name || 'Файл', type: type || 'application/octet-stream', size: blob.size })
  }
  if (added.length) void askPersist()
  return { added, tooBig }
}

/** удаляем файлы, на которые не ссылается ни одно задание (удалили задание или закрыли окно без сохранения) */
export async function pruneFiles(tasks: Task[]) {
  const used = new Set(tasks.flatMap((t) => t.attachments ?? []).map((a) => a.id))
  try {
    const keys = await filesDb.keys()
    await Promise.all(keys.filter((k) => !used.has(String(k))).map((k) => filesDb.remove(String(k))))
  } catch {
    // база недоступна — подчистим в следующий раз
  }
}

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`
}

/** короткая подпись типа: PDF, DOCX и т. п. */
export function extLabel(name: string): string {
  const ext = name.match(/\.(\w{1,5})$/)?.[1]
  return ext ? ext.toUpperCase() : 'Файл'
}
