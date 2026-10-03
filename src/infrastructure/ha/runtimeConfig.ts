export type AppConfig = {
  haUrl: string
}

// In production, nginx serves /config.json, written from HA_URL at container start.
// In dev there is no container, so fall back to VITE_HA_URL (exported by .envrc).
export async function loadConfig(): Promise<AppConfig> {
  if (import.meta.env.DEV && import.meta.env.VITE_HA_URL) {
    return { haUrl: import.meta.env.VITE_HA_URL }
  }
  const res = await fetch('/config.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Couldn't load /config.json (HTTP ${res.status})`)
  return res.json()
}
