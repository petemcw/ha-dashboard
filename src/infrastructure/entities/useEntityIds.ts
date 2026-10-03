import { useCallback, useRef, useSyncExternalStore } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStore } from './entityStore'

const sameContents = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i])

// Entity IDs whose state matches the predicate. useSyncExternalStore compares snapshots
// by identity, so the last array is cached and reused while the matching set is unchanged;
// a fresh array per call would loop. Callers memoize the predicate.
export function useEntityIds(predicate: (entity: HassEntity) => boolean): string[] {
  const cache = useRef<string[]>([])
  const getSnapshot = useCallback(() => {
    const next = Object.values(entityStore.get().entities)
      .filter(predicate)
      .map((e) => e.entity_id)
      .sort()
    if (!sameContents(cache.current, next)) cache.current = next
    return cache.current
  }, [predicate])
  return useSyncExternalStore(entityStore.subscribe, getSnapshot)
}
