import { describe, expect, it } from 'vitest'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { setBrightness, setColor, setColorTemp } from './actions'

describe('light actions', () => {
  it('sets brightness with one light.turn_on carrying brightness_pct', async () => {
    const { gateway, calls } = createFakeServiceGateway()
    void setBrightness(gateway, 'light.lamp', 40)
    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { brightness_pct: 40 },
        target: { entity_id: 'light.lamp' },
      },
    ])
  })

  it('turns the light off at zero percent instead of sending brightness_pct 0', () => {
    const { gateway, calls } = createFakeServiceGateway()
    void setBrightness(gateway, 'light.lamp', 0)
    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_off',
        data: undefined,
        target: { entity_id: 'light.lamp' },
      },
    ])
  })

  it('sets color temperature with one light.turn_on carrying color_temp_kelvin', () => {
    const { gateway, calls } = createFakeServiceGateway()
    void setColorTemp(gateway, 'light.lamp', 2700)
    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { color_temp_kelvin: 2700 },
        target: { entity_id: 'light.lamp' },
      },
    ])
  })

  it('sets a color with one light.turn_on carrying hs_color', () => {
    const { gateway, calls } = createFakeServiceGateway()
    void setColor(gateway, 'light.lamp', [240, 100])
    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { hs_color: [240, 100] },
        target: { entity_id: 'light.lamp' },
      },
    ])
  })
})
