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
