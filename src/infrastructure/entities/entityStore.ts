import type { HassEntities } from 'home-assistant-js-websocket'
import { createStore } from '../store'

export type EntityState = {
  entities: HassEntities
  // True after the first subscribeEntities emission. Until then an absent
  // entity means "not loaded yet", not "missing from HA".
  isLoaded: boolean
}

const INITIAL: EntityState = { entities: {}, isLoaded: false }

export function createEntityStore() {
  const store = createStore<EntityState>(INITIAL)
  return {
    ...store,
    setEntities: (entities: HassEntities) => store.set({ entities, isLoaded: true }),
    reset: () => store.set(INITIAL),
  }
}

// One store per page, like the connection. After a reconnect it keeps the last
// map (stale, not empty) until HA re-emits.
export const entityStore = createEntityStore()
