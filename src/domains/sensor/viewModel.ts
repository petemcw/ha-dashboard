import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus, friendlyName } from '../entityStatus.ts'
import type { SensorViewModel } from './types.ts'

export function sensorViewModel(entityId: string, entity: HassEntity | undefined): SensorViewModel {
  const status = entityStatus(entity)
  const parsed = status === 'ok' && entity!.state.trim() !== '' ? Number(entity!.state) : NaN
  const deviceClass = entity?.attributes.device_class
  return {
    entity_id: entityId,
    status,
    friendlyName: friendlyName(entityId, entity),
    deviceClass: typeof deviceClass === 'string' ? deviceClass : undefined,
    numericValue: Number.isFinite(parsed) ? parsed : undefined,
  }
}
