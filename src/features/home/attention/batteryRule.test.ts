import { describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { batterySensorState, sensorState } from '../../../domains/sensor/factories'
import { sensorViewModel } from '../../../domains/sensor/viewModel'
import { batteryRule } from './batteryRule'

const run = (...states: ReturnType<typeof sensorState>[]) =>
  batteryRule(
    testHomeConfig.batteryRule,
    states.map((s) => sensorViewModel(s.entity_id, s)),
  )

describe('battery rule', () => {
  it('lists a battery sensor below 20 percent as a chore', () => {
    const { items } = run(
      batterySensorState({
        entity_id: 'sensor.door_battery',
        state: '12',
        attributes: { friendly_name: 'Front door battery' },
      }),
    )
    expect(items).toEqual([
      {
        id: 'battery-low:sensor.door_battery',
        tier: 'chore',
        kind: 'battery',
        icon: 'battery',
        title: 'Front door battery',
        detail: '12%',
      },
    ])
  })

  it('does not list a battery sensor at 20 percent or above', () => {
    const result = run(
      batterySensorState({ entity_id: 'sensor.a', state: '20' }),
      batterySensorState({ entity_id: 'sensor.b', state: '19' }),
    )
    expect(result.items.map((i) => i.id)).toEqual(['battery-low:sensor.b'])
    expect(result.resolvedIds).toEqual(['battery-low:sensor.a'])
  })

  it('ignores battery sensors on the ignore list', () => {
    const result = run(
      batterySensorState({ entity_id: 'sensor.old_phone_battery_level', state: '3' }),
    )
    expect(result).toEqual({ items: [], resolvedIds: [] })
  })

  it('ignores a battery sensor with a non-numeric state', () => {
    const result = run(
      batterySensorState({ entity_id: 'sensor.a', state: 'unavailable' }),
      batterySensorState({ entity_id: 'sensor.b', state: 'unknown' }),
    )
    expect(result).toEqual({ items: [], resolvedIds: [] })
  })
})
