import type { Scan } from './types'

// картинки тяжёлые для localStorage, поэтому сканы и файлы живут в IndexedDB
const DB = 'studapp'
const STORES = ['scans', 'files'] as const
type StoreName = (typeof STORES)[number]

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // v2: добавилось хранилище файлов для вложений
    const req = indexedDB.open(DB, 2)
    req.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
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
  all: () => run<Scan[]>('scans', 'readonly', (s) => s.getAll() as IDBRequest<Scan[]>),
  put: (scan: Scan) => run('scans', 'readwrite', (s) => s.put(scan)),
  remove: (id: string) => run('scans', 'readwrite', (s) => s.delete(id)),
}

/** просим браузер не чистить хранилище при нехватке места */
export async function askPersist() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    // не поддерживается — ну и ладно
  }
}
