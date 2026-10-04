import { useEffect, useState } from 'react'
import type { HomeConfig } from './homeConfig'
import { loadHomeConfig } from './loadHomeConfig'

export type HomeConfigState =
  { kind: 'loading' } | { kind: 'ready'; config: HomeConfig } | { kind: 'failed'; message: string }

// Loads /home.json once, when the app mounts, next to the other startup work.
export function useLoadedHomeConfig(enabled = true): HomeConfigState {
  const [state, setState] = useState<HomeConfigState>({ kind: 'loading' })
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadHomeConfig().then(
      (config) => !cancelled && setState({ kind: 'ready', config }),
      (err: unknown) =>
        !cancelled &&
        setState({ kind: 'failed', message: err instanceof Error ? err.message : String(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [enabled])
  return state
}
