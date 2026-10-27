import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LevelPicker, ProfileFields } from './ProfileFields'
import { switchLevel } from './terms'
import { cleanProfile, type Profile } from './types'

type Props = {
  open: boolean
  profile: Profile
  onSave: (profile: Profile) => void
  onClose: () => void
}

export function ProfileSheet({ open, profile, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && <ProfileForm initial={profile} titleId={titleId} onSave={onSave} onClose={onClose} />}
    </dialog>
  )
}

type FormProps = Omit<Props, 'open' | 'profile'> & { initial: Profile; titleId: string }

function ProfileForm({ initial, titleId, onSave, onClose }: FormProps) {
  const [draft, setDraft] = useState(initial)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave(cleanProfile(draft))
  }

  return (
    <form className="sheet-form" onSubmit={submit}>
      <div className="sheet-handle" aria-hidden="true" />
      <h2 id={titleId} className="sheet-title">
        Профиль
      </h2>
      <LevelPicker value={draft.level} onChange={(level) => setDraft((d) => switchLevel(d, level))} />
      <ProfileFields profile={draft} onChange={setDraft} />
      <div className="sheet-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
      </div>
    </form>
  )
}
