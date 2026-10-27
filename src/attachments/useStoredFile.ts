import { useEffect, useState } from 'react'
import { filesDb } from './files'

/** blob файла из базы: undefined — ещё грузится, null — файла нет */
export function useStoredFile(id: string | null): Blob | null | undefined {
  const [state, setState] = useState<{ id: string; blob: Blob | null } | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    filesDb
      .get(id)
      .then((blob) => alive && setState({ id, blob: blob ?? null }))
      .catch(() => alive && setState({ id, blob: null }))
    return () => {
      alive = false
    }
  }, [id])

  return id && state?.id === id ? state.blob : undefined
}
