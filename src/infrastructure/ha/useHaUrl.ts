import { useEffect, useState } from 'react'
import { loadConfig } from './runtimeConfig'

// Runtime config, not HA state: loaded once and never changes while the app runs.
export function useHaUrl(): string | undefined {
  const [haUrl, setHaUrl] = useState<string>()
  useEffect(() => {
    let cancelled = false
    loadConfig().then(
      (c) => !cancelled && setHaUrl(c.haUrl),
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [])
  return haUrl
}
