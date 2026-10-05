import { describe, expect, it } from 'vitest'
import { lightState } from './factories'
import { lightViewModel } from './viewModel'

const L = 'light.kitchen'
const on = (attributes: Record<string, unknown>) =>
  lightViewModel(L, lightState({ entity_id: L, state: 'on', attributes }))

describe('light view model', () => {
  it('reports full brightness as 100 percent', () => {
    expect(on({ brightness: 255 }).brightnessPercent).toBe(100)
  })
  it('rounds half up: 128 is 50 percent', () => {
    expect(on({ brightness: 128 }).brightnessPercent).toBe(50)
  })
  it('has no brightness percent when the light is off', () => {
    const vm = lightViewModel(
      L,
      lightState({ entity_id: L, state: 'off', attributes: { brightness: 200 } }),
    )
    expect(vm.brightnessPercent).toBeUndefined()
  })
  it('has no brightness percent when an on light reports none', () => {
    expect(on({}).brightnessPercent).toBeUndefined()
  })
  it('keeps missing and unavailable states', () => {
    expect(lightViewModel(L, undefined).status).toBe('missing')
    expect(lightViewModel(L, lightState({ entity_id: L, state: 'unavailable' })).status).toBe(
      'unavailable',
    )
  })
})

describe('light dimming support', () => {
  const modes = (supported_color_modes: string[]) =>
    lightViewModel(L, lightState({ entity_id: L, attributes: { supported_color_modes } })).canDim

  it('cannot dim a light that only turns on and off', () => {
    expect(modes(['onoff'])).toBe(false)
  })
  it('can dim a light with a brightness or color mode', () => {
    expect(modes(['brightness'])).toBe(true)
    expect(modes(['color_temp', 'xy'])).toBe(true)
  })
  it('cannot dim a light that reports no color modes', () => {
    expect(modes([])).toBe(false)
  })
})

describe('light color support', () => {
  const vm = (attributes: Record<string, unknown>, state = 'on') =>
    lightViewModel(L, lightState({ entity_id: L, state, attributes }))

  it('supports color temperature when color_temp is a supported mode', () => {
    expect(vm({ supported_color_modes: ['color_temp'] }).supportsColorTemp).toBe(true)
    expect(vm({ supported_color_modes: ['brightness'] }).supportsColorTemp).toBe(false)
  })
  it('supports color when any color mode is supported', () => {
    for (const mode of ['hs', 'xy', 'rgb', 'rgbw', 'rgbww']) {
      expect(vm({ supported_color_modes: [mode] }).supportsColor).toBe(true)
    }
    expect(vm({ supported_color_modes: ['color_temp', 'white'] }).supportsColor).toBe(false)
  })
  it('reads the Kelvin range, falling back to a common range', () => {
    expect(vm({ min_color_temp_kelvin: 2200, max_color_temp_kelvin: 6500 }).kelvinRange).toEqual({
      min: 2200,
      max: 6500,
    })
    expect(vm({}).kelvinRange).toEqual({ min: 2000, max: 6500 })
  })
  it('reports the current temperature and color only while on and in that mode', () => {
    const attrs = {
      color_mode: 'color_temp',
      color_temp_kelvin: 3000,
      hs_color: [10, 20],
    }
    expect(vm(attrs).colorTempKelvin).toBe(3000)
    expect(vm(attrs).hsColor).toBeUndefined()
    expect(vm({ ...attrs, color_mode: 'xy' }).hsColor).toEqual([10, 20])
    expect(vm({ ...attrs, color_mode: 'xy' }).colorTempKelvin).toBeUndefined()
    expect(vm(attrs, 'off').colorTempKelvin).toBeUndefined()
  })
})
