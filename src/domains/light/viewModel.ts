import type { HassEntity } from 'home-assistant-js-websocket'
import { onOffViewModel, type OnOffViewModel } from '../onOff.ts'

export type LightViewModel = OnOffViewModel & {
  // 0-100, only while the light is on and reports a brightness.
  brightnessPercent?: number
}

export function lightViewModel(entityId: string, entity: HassEntity | undefined): LightViewModel {
  const base = onOffViewModel(entityId, entity)
  const brightness = entity?.attributes.brightness
  if (!base.isOn || typeof brightness !== 'number') return base
  // HA reports brightness as 0-255.
  return { ...base, brightnessPercent: Math.round((brightness / 255) * 100) }
}
