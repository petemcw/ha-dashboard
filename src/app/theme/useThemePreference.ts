import { useCallback, useEffect, useState } from 'react'
import { THEME_KEY } from '../../infrastructure/storageKeys'

export type ThemePreference = 'system' | 'light' | 'dark'

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function writePreference(pref: ThemePreference) {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, pref)
  } catch {
    // Storage blocked: the override lasts until the page reloads.
  }
}

// `system` removes data-theme so the prefers-color-scheme rules in tokens.css apply.
function applyPreference(pref: ThemePreference) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
}

export function useThemePreference() {
  const [preference, setPreference] = useState(readPreference)

  useEffect(() => applyPreference(preference), [preference])

  const update = useCallback((pref: ThemePreference) => {
    writePreference(pref)
    setPreference(pref)
  }, [])

  return [preference, update] as const
}
