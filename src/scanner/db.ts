import type { Scan } from './types'

// картинки тяжёлые для localStorage, поэтому сканы живут в IndexedDB
const DB = 'studapp'
const STORE = 'scans'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => {
      db.close()
      resolve(req.result)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export const scansDb = {
  all: () => run<Scan[]>('readonly', (s) => s.getAll() as IDBRequest<Scan[]>),
  put: (scan: Scan) => run('readwrite', (s) => s.put(scan)),
  remove: (id: string) => run('readwrite', (s) => s.delete(id)),
}

/** просим браузер не чистить хранилище при нехватке места */
export async function askPersist() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    // не поддерживается — ну и ладно
  }
}
