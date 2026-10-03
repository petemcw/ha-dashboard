import type { HassEntity } from 'home-assistant-js-websocket'
import { entityState } from '../factories.ts'

export const APPLE_TV_ID = 'media_player.family_room_apple_tv'

export function mediaPlayer(
  state: string,
  overrides: { entity_id?: string; attributes?: Record<string, unknown> } = {},
): HassEntity {
  return entityState({
    entity_id: overrides.entity_id ?? APPLE_TV_ID,
    state,
    attributes: { friendly_name: 'Family Room Apple TV', ...overrides.attributes },
  })
}
