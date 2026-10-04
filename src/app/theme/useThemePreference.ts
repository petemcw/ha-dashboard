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

// Browser chrome (status bar, address bar) colors, matching --surface in tokens.css.
const THEME_COLORS = { light: '#fff7ed', dark: '#1a1411' } as const

// `system` removes data-theme so the prefers-color-scheme rules in tokens.css apply.
function applyPreference(pref: ThemePreference) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
  // index.html has one theme-color per color scheme; an override pins both to its color.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light'
    meta.content = THEME_COLORS[pref === 'system' ? scheme : pref]
  }
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
