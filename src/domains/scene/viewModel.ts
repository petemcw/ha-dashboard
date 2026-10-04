import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus, type EntityStatus } from '../entityStatus.ts'

export type SceneViewModel = { entity_id: string; status: EntityStatus }

// A scene's state is its last activation time, which a tile has no use for. HA reports
// `unknown` until the first activation, and that scene is still perfectly activatable,
// so unknown counts as ok here.
export function sceneViewModel(entityId: string, entity: HassEntity | undefined): SceneViewModel {
  const status = entityStatus(entity)
  return { entity_id: entityId, status: status === 'unknown' ? 'ok' : status }
}
