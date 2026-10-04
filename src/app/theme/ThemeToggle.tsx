import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ThemePreference } from './useThemePreference'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// jsdom has no matchMedia; no matchMedia means light.
function useDeviceIsDark() {
  const [dark, setDark] = useState(() => window.matchMedia?.(DARK_QUERY).matches ?? false)
  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY)
    if (!query) return
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return dark
}

type ThemeToggleProps = {
  preference: ThemePreference
  onChange: (pref: ThemePreference) => void
}

// One tap flips the effective theme by writing an explicit preference; System stays
// reachable only from the settings sheet.
export function ThemeToggle({ preference, onChange }: ThemeToggleProps) {
  const deviceDark = useDeviceIsDark()
  const dark = preference === 'system' ? deviceDark : preference === 'dark'
  const Icon = dark ? Sun : Moon
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => onChange(dark ? 'light' : 'dark')}
    >
      <Icon size={24} aria-hidden="true" />
    </button>
  )
}
