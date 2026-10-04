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

let shared: Promise<AppConfig> | undefined

// One request for everyone (the connection and the People card both need the HA URL).
// config.json can't change while the page is open; a failed fetch isn't kept, so the
// startup retry asks again. The dev VITE_HA_URL path costs nothing and isn't cached.
export function getConfig(): Promise<AppConfig> {
  if (import.meta.env.DEV && import.meta.env.VITE_HA_URL) return loadConfig()
  shared ??= loadConfig().catch((err: unknown) => {
    shared = undefined
    throw err
  })
  return shared
}
