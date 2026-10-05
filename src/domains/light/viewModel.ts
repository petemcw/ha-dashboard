import type { HassEntity } from 'home-assistant-js-websocket'
import { onOffViewModel, type OnOffViewModel } from '../onOff.ts'

export type LightViewModel = OnOffViewModel & {
  // 0-100, only while the light is on and reports a brightness.
  brightnessPercent?: number
  // Whether the light can be set to a level, not just on or off.
  canDim: boolean
  supportsColorTemp: boolean
  supportsColor: boolean
  // The light's own Kelvin limits.
  kelvinRange: { min: number; max: number }
  // The current color temperature, only while the light is on in color temperature mode.
  colorTempKelvin?: number
  // The current [hue 0-360, saturation 0-100], only while on in a color mode. HA also reports
  // hs_color in color_temp mode (derived from the temperature), which isn't a chosen color.
  hsColor?: [number, number]
}

const COLOR_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww']
// Used when the light doesn't report limits.
const DEFAULT_KELVIN_RANGE = { min: 2000, max: 6500 }

export function lightViewModel(entityId: string, entity: HassEntity | undefined): LightViewModel {
  const modes = supportedModes(entity)
  const attrs = entity?.attributes ?? {}
  const base: LightViewModel = {
    ...onOffViewModel(entityId, entity),
    canDim: supportsDimming(entity),
    supportsColorTemp: modes.includes('color_temp'),
    supportsColor: modes.some((mode) => COLOR_MODES.includes(mode)),
    kelvinRange: {
      min: numberOr(attrs.min_color_temp_kelvin, DEFAULT_KELVIN_RANGE.min),
      max: numberOr(attrs.max_color_temp_kelvin, DEFAULT_KELVIN_RANGE.max),
    },
  }
  if (!base.isOn) return base
  const result = { ...base }
  if (typeof attrs.brightness === 'number') {
    // HA reports brightness as 0-255.
    result.brightnessPercent = Math.round((attrs.brightness / 255) * 100)
  }
  if (attrs.color_mode === 'color_temp' && typeof attrs.color_temp_kelvin === 'number') {
    result.colorTempKelvin = attrs.color_temp_kelvin
  }
  if (COLOR_MODES.includes(attrs.color_mode) && Array.isArray(attrs.hs_color)) {
    result.hsColor = [attrs.hs_color[0], attrs.hs_color[1]]
  }
  return result
}

const numberOr = (value: unknown, fallback: number) =>
  typeof value === 'number' ? value : fallback

function supportedModes(entity: HassEntity | undefined): string[] {
  const modes = entity?.attributes.supported_color_modes
  return Array.isArray(modes) ? modes : []
}

// Every color mode but 'onoff' implies a brightness level. A light that reports no modes
// can't be told apart from a broken one, so it doesn't offer a drag.
function supportsDimming(entity: HassEntity | undefined): boolean {
  return supportedModes(entity).some((mode) => mode !== 'onoff')
}
