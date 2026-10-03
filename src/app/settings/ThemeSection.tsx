import type { ThemePreference } from '../theme/useThemePreference'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

type ThemeSectionProps = {
  preference: ThemePreference
  onChange: (pref: ThemePreference) => void
}

export function ThemeSection({ preference, onChange }: ThemeSectionProps) {
  return (
    <fieldset className="sheet__section">
      <legend>Theme</legend>
      {OPTIONS.map(({ value, label }) => (
        <label key={value} className="choice">
          <input
            type="radio"
            name="theme"
            checked={preference === value}
            onChange={() => onChange(value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  )
}
