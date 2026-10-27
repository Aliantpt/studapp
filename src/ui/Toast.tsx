import type { ToastData } from './useToast'

type Props = { toast: ToastData | null; onClose: () => void }

export function Toast({ toast, onClose }: Props) {
  return (
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
                onClose()
              }}
            >
              Вернуть
            </button>
          )}
        </div>
      )}
    </div>
  )
}
