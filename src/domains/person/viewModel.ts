import type { HassEntity } from 'home-assistant-js-websocket'
import type { PersonViewModel, Presence } from './types'

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]
  const last = words.length > 1 ? words[words.length - 1] : ''
  return `${first[0]}${last[0] ?? ''}`.toUpperCase()
}

// Missing entities have no friendly_name, so derive one from the id.
function nameFromId(entityId: string): string {
  return entityId.replace(/^person\./, '').replace(/_/g, ' ')
}

function presenceOf(state: string): Presence {
  if (state === 'home') return 'home'
  if (state === 'not_home') return 'away'
  if (state === 'unknown') return 'unknown'
  if (state === 'unavailable') return 'unavailable'
  // Anything else is the name of a zone the person is in.
  return 'zone'
}

// entity_picture is a relative path and HA is a different origin from the app.
function resolvePicture(path: unknown, haUrl: string): string | undefined {
  if (typeof path !== 'string' || path === '') return undefined
  return new URL(path, haUrl).toString()
}

export function personViewModel(
  entity: HassEntity | undefined,
  entityId: string,
  haUrl: string,
): PersonViewModel {
  if (!entity) {
    const name = nameFromId(entityId)
    return { entity_id: entityId, name, initials: initialsOf(name), presence: 'missing' }
  }
  const friendly = entity.attributes.friendly_name
  const name = typeof friendly === 'string' && friendly ? friendly : nameFromId(entityId)
  const presence = presenceOf(entity.state)
  return {
    entity_id: entityId,
    name,
    initials: initialsOf(name),
    presence,
    zoneName: presence === 'zone' ? entity.state : undefined,
    pictureUrl: resolvePicture(entity.attributes.entity_picture, haUrl),
  }
}
