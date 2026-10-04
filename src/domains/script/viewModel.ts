import type { HassEntity } from 'home-assistant-js-websocket'
import { onOffViewModel, type OnOffViewModel } from '../onOff.ts'

export type ScriptViewModel = Omit<OnOffViewModel, 'isOn'> & { isRunning: boolean }

export function scriptViewModel(entityId: string, entity: HassEntity | undefined): ScriptViewModel {
  const { isOn, ...rest } = onOffViewModel(entityId, entity)
  return { ...rest, isRunning: isOn }
}
