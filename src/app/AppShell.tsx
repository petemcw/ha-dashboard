import { useCallback, useState } from 'react'
import { HomeScreen } from '../features/home/HomeScreen'
import { isDemoMode } from '../infrastructure/ha/demoMode'
import { useConnectionStatus } from '../infrastructure/ha/useConnectionStatus'
import { DemoBadge } from './demo/DemoBadge'
import { ConnectionBanner } from './ConnectionBanner'
import { FavoritesSettingsSection } from './settings/FavoritesSettingsSection'
import { KioskTokenSection } from './settings/KioskTokenSection'
import { SettingsSheet } from './settings/SettingsSheet'
import { SignOutSection } from './settings/SignOutSection'
import { ThemeSection } from './settings/ThemeSection'
import { useThemePreference } from './theme/useThemePreference'

export function AppShell({ onTokenSaved = () => {} }: { onTokenSaved?: () => void }) {
  const status = useConnectionStatus()
  const demo = isDemoMode()
  // Held here, not in the sheet, so a stored override applies while the sheet is closed.
  const [theme, setTheme] = useThemePreference()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const stale = status.kind !== 'connected'
  // Stable, so the memoized favorites section doesn't re-render with the shell.
  const openSettings = useCallback(() => setSettingsOpen(true), [])

  return (
    <>
      {demo && <DemoBadge />}
      <ConnectionBanner status={status} />
      {/* No aria-busy: some screen readers mute busy regions, and an outage can last a
          while. The banner says the values are stale. */}
      <div className="content" data-stale={stale ? '' : undefined}>
        <HomeScreen onOpenSettings={openSettings} />
      </div>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <ThemeSection preference={theme} onChange={setTheme} />
        <FavoritesSettingsSection />
        {!demo && <KioskTokenSection onSaved={onTokenSaved} />}
        {!demo && <SignOutSection />}
      </SettingsSheet>
    </>
  )
}
