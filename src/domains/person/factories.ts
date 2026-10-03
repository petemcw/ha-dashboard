import type { HassEntity } from 'home-assistant-js-websocket'
import { entityState } from '../factories.ts'

type PersonInput = {
  entity_id?: string
  state?: string
  friendly_name?: string
  entity_picture?: string
}

export function personState(input: PersonInput = {}): HassEntity {
  const { entity_id = 'person.alex_rivera', state = 'home', ...rest } = input
  return entityState({
    entity_id,
    state,
    attributes: {
      friendly_name: rest.friendly_name ?? 'Alex Rivera',
      ...(rest.entity_picture ? { entity_picture: rest.entity_picture } : {}),
    },
  })
}
