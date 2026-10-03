import type { HassEntity } from 'home-assistant-js-websocket'
import { onOffViewModel } from '../onOff.ts'

export const binarySensorViewModel = (entityId: string, entity: HassEntity | undefined) =>
  onOffViewModel(entityId, entity)
