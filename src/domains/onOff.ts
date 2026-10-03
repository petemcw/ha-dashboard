import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus, type EntityStatus } from './entityStatus.ts'

export type OnOffViewModel = {
  entity_id: string
  status: EntityStatus
  // Only true for a present, available entity that HA reports as on (door: open).
  isOn: boolean
  // When the entity last changed state, while it is on. HA resets this on restart.
  onSince?: Date
}

export function onOffViewModel(entityId: string, entity: HassEntity | undefined): OnOffViewModel {
  const status = entityStatus(entity)
  if (status !== 'ok') return { entity_id: entityId, status, isOn: false }
  const isOn = entity!.state === 'on'
  return {
    entity_id: entityId,
    status,
    isOn,
    onSince: isOn ? new Date(entity!.last_changed) : undefined,
  }
}
