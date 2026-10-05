import { useSyncExternalStore } from 'react'
import type { HassEntities } from 'home-assistant-js-websocket'
import { personWhereabouts } from '../../domains/person/viewModel'
import { entityStore } from '../../infrastructure/entities/entityStore'
import type { PersonPresence } from './roomSelection'

// The last answer, shared by every caller (the selector and the room card).
let last: { entities: HassEntities; key: string; persons: PersonPresence[] } | undefined

function snapshot(): PersonPresence[] {
  const { entities } = entityStore.get()
  if (last?.entities === entities) return last.persons
  const persons: PersonPresence[] = []
  for (const id in entities) {
    if (!id.startsWith('person.')) continue
    persons.push(personWhereabouts(entities[id]))
  }
  const key = persons.map((p) => `${p.userId}:${p.presence}`).join('|')
  // useSyncExternalStore compares snapshots by identity: the same array while nobody's user
  // or presence changed.
  if (last?.key === key) {
    last.entities = entities
    return last.persons
  }
  last = { entities, key, persons }
  return persons
}

// Who is where, and nothing else. HA rewrites a person's attributes (latitude, longitude, GPS
// accuracy) on every location report, even at home; those reports change no one's presence,
// so they re-render nothing that reads this.
export function usePersonPresence(): PersonPresence[] {
  return useSyncExternalStore(entityStore.subscribe, snapshot)
}
