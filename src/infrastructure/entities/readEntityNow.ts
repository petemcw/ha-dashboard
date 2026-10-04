import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStore } from './entityStore'

// The store's value at this instant, for send-time rechecks. Components must not close
// over a render-time copy for this: it can be a frame stale by the time the user confirms.
export function readEntityNow(entityId: string): HassEntity | undefined {
  return entityStore.get().entities[entityId]
}
