import type { HassEntity } from 'home-assistant-js-websocket'
import { entityState } from '../factories.ts'

export const DEFAULT_SUN_ID = 'sun.sun'

export function sunState(
  nextSetting: string | undefined,
  state = 'above_horizon',
  entityId = DEFAULT_SUN_ID,
): HassEntity {
  return entityState({
    entity_id: entityId,
    state,
    attributes: nextSetting === undefined ? {} : { next_setting: nextSetting },
  })
}
