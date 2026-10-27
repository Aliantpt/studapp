import { useEffect, useState } from 'react'

export type ToastData = { text: string; undo?: () => void }

/** тост сам прячется через 5 секунд */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  return [toast, setToast] as const
}
