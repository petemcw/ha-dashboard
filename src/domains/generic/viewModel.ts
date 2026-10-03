import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus, type EntityStatus } from '../entityStatus.ts'

export type StateViewModel = {
  entity_id: string
  status: EntityStatus
  // HA's own state text ("playing", "closed", "heat"); only set when status is ok.
  state?: string
}

// For domains without their own view model yet (fan, media_player, cover, ...).
export function stateViewModel(entityId: string, entity: HassEntity | undefined): StateViewModel {
  const status = entityStatus(entity)
  if (status !== 'ok') return { entity_id: entityId, status }
  return { entity_id: entityId, status, state: entity!.state }
}
