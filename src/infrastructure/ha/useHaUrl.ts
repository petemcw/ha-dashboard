import { useEffect, useState } from 'react'
import { isDemoMode } from './demoMode'
import { getConfig } from './runtimeConfig'

// Runtime config, not HA state: loaded once and never changes while the app runs.
export function useHaUrl(): string | undefined {
  // Demo has no HA to point pictures at, and no config.json to ask.
  const [haUrl, setHaUrl] = useState<string | undefined>(isDemoMode() ? location.origin : undefined)
  useEffect(() => {
    if (isDemoMode()) return
    let cancelled = false
    getConfig().then(
      (c) => !cancelled && setHaUrl(c.haUrl),
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [])
  return haUrl
}
