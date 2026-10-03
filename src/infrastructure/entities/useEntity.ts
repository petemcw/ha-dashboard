import { useSyncExternalStore } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStore, type EntityState } from './entityStore'

// useSyncExternalStore has no selector argument, so selectors must return a
// primitive or an object that keeps its identity. The library's processEvent
// reuses unchanged entity objects, so the entity itself is a stable snapshot.
function useEntityStore<T>(select: (state: EntityState) => T): T {
  return useSyncExternalStore(entityStore.subscribe, () => select(entityStore.get()))
}

// undefined means HA doesn't have this entity (once loaded): render it as missing.
export function useEntity(entityId: string): HassEntity | undefined {
  return useEntityStore((s) => s.entities[entityId])
}

export function useEntitiesLoaded(): boolean {
  return useEntityStore((s) => s.isLoaded)
}
