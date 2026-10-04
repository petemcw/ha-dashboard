import { describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { binarySensorState } from '../../../domains/binary_sensor/factories'
import { binarySensorViewModel } from '../../../domains/binary_sensor/viewModel'
import { batterySensorState, sensorState } from '../../../domains/sensor/factories'
import { sensorViewModel } from '../../../domains/sensor/viewModel'
import { switchViewModel } from '../../../domains/switch/viewModel'
import { updateState } from '../../../domains/update/factories'
import { updateViewModel } from '../../../domains/update/viewModel'
import { batteryRule } from './batteryRule'
import { leftOnRule } from './leftOnRule'
import { filterRule, tonerLowRule } from './thresholdRule'
import { updateRule } from './updateRule'

const NOW = new Date('2026-10-03T12:00:00Z')
const { leftOnRules, filterRules, tonerRule, batteryRule: battery } = testHomeConfig
const sensorVm = (entity_id: string, state: string) => {
  const s = sensorState({ entity_id, state })
  return sensorViewModel(entity_id, s)
}

describe('attention item kinds', () => {
  it('gives every attention item the kind of the rule that raised it', () => {
    const doorRule = leftOnRules[0]
    const door = binarySensorState({
      entity_id: doorRule.entity_id,
      state: 'on',
      last_changed: NOW.getTime() / 1000 - 3600,
    })
    const b = batterySensorState({ entity_id: 'sensor.b', state: '5' })
    const upd = updateState({ entity_id: 'update.x', state: 'on' })
    const items = [
      leftOnRule(doorRule, binarySensorViewModel(doorRule.entity_id, door), NOW),
      batteryRule(battery, [sensorViewModel(b.entity_id, b)]),
      updateRule({ id: 'u', entity_id: 'update.x', state: 'on' }, updateViewModel('update.x', upd)),
      tonerLowRule(tonerRule, sensorVm(tonerRule.entity_id, '1')),
      filterRule(filterRules[0], sensorVm(filterRules[0].entity_id, '0')),
      leftOnRule(doorRule, switchViewModel(doorRule.entity_id, undefined), NOW),
    ].flatMap((r) => r.items)
    expect(items.map((i) => i.kind)).toEqual([
      'left-on',
      'battery',
      'update',
      'toner',
      'filter',
      'missing',
    ])
  })
})
