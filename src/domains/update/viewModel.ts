import type { HassEntity } from 'home-assistant-js-websocket'
import { onOffViewModel } from '../onOff.ts'
import type { UpdateViewModel } from './types.ts'

const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined)

// Also reads binary_sensor entities that mean "update available" (the Docker image sensor).
export function updateViewModel(entityId: string, entity: HassEntity | undefined): UpdateViewModel {
  const base = onOffViewModel(entityId, entity)
  return {
    entity_id: entityId,
    status: base.status,
    friendlyName: text(entity?.attributes.friendly_name) ?? entityId,
    isPending: base.isOn,
    installedVersion: text(entity?.attributes.installed_version),
    latestVersion: text(entity?.attributes.latest_version),
  }
}
