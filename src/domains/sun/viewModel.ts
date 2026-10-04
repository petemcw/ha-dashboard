import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus } from '../entityStatus'
import type { SunViewModel } from './types'

export function sunViewModel(
  entity: HassEntity | undefined,
  entityId = entity?.entity_id ?? '',
): SunViewModel {
  const status = entityStatus(entity)
  const raw = entity?.attributes.next_setting
  const date = status === 'ok' && typeof raw === 'string' ? new Date(raw) : undefined
  return {
    entity_id: entity?.entity_id ?? entityId,
    status,
    nextSetting: date && !Number.isNaN(date.getTime()) ? date : undefined,
  }
}
