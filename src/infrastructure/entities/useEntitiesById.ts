import { useRef, useSyncExternalStore } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStore } from './entityStore'

export type EntitiesById = Readonly<Record<string, HassEntity | undefined>>

// The entities for a list of IDs, keyed by ID; undefined means HA doesn't have it. Keeps
// the same object while the IDs and every entity object are unchanged, since the snapshot
// is compared by identity. Pass a stable `ids` array (a module constant or useEntityIds).
export function useEntitiesById(ids: readonly string[]): EntitiesById {
  const cache = useRef<{ ids: readonly string[]; byId: EntitiesById }>(undefined)
  const getSnapshot = () => {
    const { entities } = entityStore.get()
    const prev = cache.current
    if (prev?.ids === ids && ids.every((id) => prev.byId[id] === entities[id])) return prev.byId
    const byId = Object.fromEntries(ids.map((id) => [id, entities[id]]))
    cache.current = { ids, byId }
    return byId
  }
  return useSyncExternalStore(entityStore.subscribe, getSnapshot)
}
