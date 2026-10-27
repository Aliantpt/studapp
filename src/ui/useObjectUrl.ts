import { useEffect, useState } from 'react'

/** blob → временная ссылка для <img>, сама освобождается */
export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    // eslint-disable-next-line react/set-state-in-effect -- ссылка живёт ровно пока жив blob
    setUrl(u)
    return () => {
      URL.revokeObjectURL(u)
      setUrl(undefined)
    }
  }, [blob])
  return blob ? url : undefined
}
