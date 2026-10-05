import type { Connection } from 'home-assistant-js-websocket'
import {
  fetchRegistry,
  REGISTRY_KINDS,
  UPDATE_EVENTS,
  type Registries,
  type RegistryKind,
} from './registries'
import { registryStore } from './registryStore'

// Entity- and device-registry events arrive in floods while an integration reloads.
export const REFETCH_DEBOUNCE_MS = 500

// Loads the four registries, follows their update events, and reloads them after a
// reconnect (the library resubscribes events but doesn't refetch lists). Returns stop.
export function startRegistries(conn: Connection): () => void {
  let stopped = false
  const loaded: Partial<Registries> = {}
  const timers = new Map<RegistryKind, ReturnType<typeof setTimeout>>()

  const publish = () => {
    if (REGISTRY_KINDS.every((k) => loaded[k])) {
      registryStore.set({ kind: 'ready', registries: { ...(loaded as Registries) } })
    }
  }

  // A failed refetch keeps the last good data; only a first load that fails is an error.
  const refetch = async <K extends RegistryKind>(kind: K) => {
    try {
      const records = await fetchRegistry(conn, kind)
      if (stopped) return
      loaded[kind] = records
      publish()
    } catch {
      if (stopped) return
      if (registryStore.get().kind !== 'ready') registryStore.set({ kind: 'error' })
    }
  }

  const refetchAll = () => REGISTRY_KINDS.forEach((k) => void refetch(k))

  const schedule = (kind: RegistryKind) => {
    clearTimeout(timers.get(kind))
    timers.set(
      kind,
      setTimeout(() => {
        timers.delete(kind)
        void refetch(kind)
      }, REFETCH_DEBOUNCE_MS),
    )
  }

  refetchAll()
  conn.addEventListener('ready', refetchAll)

  const unsubscribes = REGISTRY_KINDS.map((kind) => {
    const sub = conn.subscribeEvents(() => schedule(kind), UPDATE_EVENTS[kind])
    // An HA (or fake) that rejects the subscription still has its lists loaded.
    sub.catch(() => {})
    return sub
  })

  return () => {
    stopped = true
    conn.removeEventListener('ready', refetchAll)
    timers.forEach(clearTimeout)
    timers.clear()
    for (const sub of unsubscribes) sub.then((unsub) => unsub()).catch(() => {})
  }
}
