import type { HassEntity } from 'home-assistant-js-websocket'
import { entityState } from '../factories.ts'

export const DEFAULT_PLAYER_ID = 'media_player.living_room_tv'

export function mediaPlayer(
  state: string,
  overrides: { entity_id?: string; attributes?: Record<string, unknown> } = {},
): HassEntity {
  return entityState({
    entity_id: overrides.entity_id ?? DEFAULT_PLAYER_ID,
    state,
    attributes: { friendly_name: 'Living Room TV', ...overrides.attributes },
  })
}
