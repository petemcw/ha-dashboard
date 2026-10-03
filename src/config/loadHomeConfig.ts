import { parseHomeConfig, type HomeConfig } from './homeConfig'

// nginx serves /home.json from a mounted directory; in dev, Vite serves public/home.json.
// Neither is in the repo, so a failure here is the owner's cue to create the file.
export async function loadHomeConfig(): Promise<HomeConfig> {
  const res = await fetch('/home.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Couldn't load /home.json (HTTP ${res.status})`)
  const raw: unknown = await res.json().catch(() => {
    throw new Error('/home.json is not valid JSON')
  })
  return parseHomeConfig(raw)
}
