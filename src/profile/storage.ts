import { useCallback, useState } from 'react'
import type { Profile } from './types'

const KEY = 'studapp.profile.v1'

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

/** null — человек ещё не проходил приветствие */
export function useProfileState() {
  const [profile, setProfile] = useState<Profile | null>(load)

  const save = useCallback((next: Profile) => {
    setProfile(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // без хранилища профиль живёт до перезагрузки
    }
  }, [])

  return { profile, save }
}
