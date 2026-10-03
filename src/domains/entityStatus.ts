import type { HassEntity } from 'home-assistant-js-websocket'

// Every view model carries one, so unavailable, unknown, and missing are first-class.
export type EntityStatus = 'ok' | 'unavailable' | 'unknown' | 'missing'

// undefined means HA doesn't have the entity: a visible "missing" state, never a guess.
export function entityStatus(entity: HassEntity | undefined): EntityStatus {
  if (!entity) return 'missing'
  if (entity.state === 'unavailable' || entity.state === 'unknown') return entity.state
  return 'ok'
}

// HA's display name, or the entity ID when there is none (always, for a missing entity).
export function friendlyName(entityId: string, entity: HassEntity | undefined): string {
  const name = entity?.attributes.friendly_name
  return typeof name === 'string' ? name : entityId
}
