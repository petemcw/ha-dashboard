import type { HassEntity } from 'home-assistant-js-websocket'
import { resolveEntityPicture } from '../entityPicture'
import type { PersonViewModel, Presence } from './types'

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]
  const last = words.length > 1 ? words[words.length - 1] : ''
  return `${first[0]}${last[0] ?? ''}`.toUpperCase()
}

function shortNameOf(name: string): string {
  const first = name.split(/\s+/).find(Boolean) ?? name
  return first.charAt(0).toUpperCase() + first.slice(1)
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

const userIdOf = (entity: HassEntity) =>
  typeof entity.attributes.user_id === 'string' ? entity.attributes.user_id : undefined

// Where a person is and which HA user they are: the parts that need no HA URL (unlike their
// picture), for code that only asks who is home.
export function personWhereabouts(
  entity: HassEntity | undefined,
): Pick<PersonViewModel, 'presence' | 'userId'> {
  return entity
    ? { presence: presenceOf(entity.state), userId: userIdOf(entity) }
    : { presence: 'missing', userId: undefined }
}

export function personViewModel(
  entity: HassEntity | undefined,
  entityId: string,
  haUrl: string,
): PersonViewModel {
  if (!entity) {
    const name = nameFromId(entityId)
    return {
      entity_id: entityId,
      name,
      shortName: shortNameOf(name),
      initials: initialsOf(name),
      presence: 'missing',
    }
  }
  const friendly = entity.attributes.friendly_name
  const name = typeof friendly === 'string' && friendly ? friendly : nameFromId(entityId)
  const presence = presenceOf(entity.state)
  return {
    entity_id: entityId,
    name,
    shortName: shortNameOf(name),
    initials: initialsOf(name),
    presence,
    zoneName: presence === 'zone' ? entity.state : undefined,
    pictureUrl: resolveEntityPicture(entity.attributes.entity_picture, haUrl),
    userId: userIdOf(entity),
  }
}
