import { useCallback, useSyncExternalStore } from 'react'
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket'
import { entityStore } from './entityStore'

type Predicate = (entity: HassEntity) => boolean

// The last answer for a predicate: the entity map it was computed from, and the sorted IDs.
type Selection = { entities: HassEntities; ids: string[]; idSet: Set<string> }

// One selection per predicate, shared by every subscriber that passes the same function,
// so a state change costs one scan per predicate, not one per component. Keyed weakly, so
// a predicate rebuilt per search query is dropped with the query.
const selections = new WeakMap<Predicate, Selection>()

const NONE: string[] = []

function select(predicate: Predicate): string[] {
  const { entities } = entityStore.get()
  const prev = selections.get(predicate)
  // React reads the snapshot on every render and every store emission; only a new entity
  // map can change the answer.
  if (prev?.entities === entities) return prev.ids
  const next: string[] = []
  for (const id in entities) if (predicate(entities[id])) next.push(id)
  // useSyncExternalStore compares snapshots by identity, so the last array is reused while
  // the matching set is unchanged; a fresh array per emission would loop. Checked before
  // sorting, so the usual emission (nothing joined or left) skips the sort.
  if (prev && prev.ids.length === next.length && next.every((id) => prev.idSet.has(id))) {
    prev.entities = entities
    return prev.ids
  }
  next.sort()
  selections.set(predicate, { entities, ids: next, idSet: new Set(next) })
  return next
}

// Entity IDs whose state matches the predicate, sorted. Callers pass a module constant or a
// memoized predicate; null matches nothing without scanning.
export function useEntityIds(predicate: Predicate | null): string[] {
  const getSnapshot = useCallback(() => (predicate ? select(predicate) : NONE), [predicate])
  return useSyncExternalStore(entityStore.subscribe, getSnapshot)
}
