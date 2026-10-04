import { describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { binarySensorState } from '../../../domains/binary_sensor/factories'
import { binarySensorViewModel } from '../../../domains/binary_sensor/viewModel'
import { switchState } from '../../../domains/switch/factories'
import { switchViewModel } from '../../../domains/switch/viewModel'
import { leftOnRule } from './leftOnRule'

const NOW = new Date('2026-10-03T12:00:00Z')
const minutesAgo = (m: number) => NOW.getTime() / 1000 - m * 60

const doorRule = testHomeConfig.leftOnRules.find((r) => r.id === 'garage-door')!
const heaterRule = testHomeConfig.leftOnRules.find((r) => r.id === 'space-heater')!

const door = (state: string, min = 0) =>
  binarySensorViewModel(
    doorRule.entity_id,
    binarySensorState({ entity_id: doorRule.entity_id, state, last_changed: minutesAgo(min) }),
  )
const heater = (state: string, min = 0) =>
  switchViewModel(
    heaterRule.entity_id,
    switchState({ entity_id: heaterRule.entity_id, state, last_changed: minutesAgo(min) }),
  )

describe('left-on rule', () => {
  it('does not flag the garage door before it has been open for 10 minutes', () => {
    expect(leftOnRule(doorRule, door('on', 9), NOW).items).toEqual([])
  })

  it('flags the garage door once it has been open for 10 minutes', () => {
    const { items } = leftOnRule(doorRule, door('on', 10), NOW)
    expect(items).toEqual([
      {
        id: 'garage-door',
        tier: 'urgent',
        kind: 'left-on',
        icon: 'garage',
        title: 'Garage door',
        detail: 'Open for 10 min',
        action: {
          label: 'Close garage door',
          icon: 'close-garage',
          pendingLabel: 'Closing…',
          confirmLabel: 'Confirm close garage door',
          ha: doorRule.action,
          sensorId: 'binary_sensor.garage_door',
          onState: 'on',
        },
      },
    ])
  })

  it('flags the space heater after an hour on but not after 59 minutes', () => {
    expect(leftOnRule(heaterRule, heater('on', 59), NOW).items).toEqual([])
    const { items } = leftOnRule(heaterRule, heater('on', 60), NOW)
    expect(items).toMatchObject([
      {
        id: 'space-heater',
        detail: 'On for 1 h',
        action: { label: 'Turn off', pendingLabel: 'Turning off…', ha: heaterRule.action },
      },
    ])
    expect(items[0].action).not.toHaveProperty('confirmLabel')
  })

  it('does not flag an entity that is unavailable or unknown', () => {
    for (const state of ['unavailable', 'unknown']) {
      expect(leftOnRule(heaterRule, heater(state, 500), NOW).items).toEqual([])
    }
  })

  it('reports a configured entity missing from Home Assistant as a missing-entity item', () => {
    const { items } = leftOnRule(heaterRule, switchViewModel(heaterRule.entity_id, undefined), NOW)
    expect(items).toEqual([
      {
        id: `missing:${heaterRule.entity_id}`,
        tier: 'chore',
        kind: 'missing',
        title: 'Missing entity',
        detail: heaterRule.entity_id,
      },
    ])
  })

  it('reports a closed garage door as resolved but not one still open under 10 minutes', () => {
    expect(leftOnRule(doorRule, door('off'), NOW).resolvedIds).toEqual(['garage-door'])
    expect(leftOnRule(doorRule, door('on', 3), NOW).resolvedIds).toEqual([])
  })

  it('does not report an unavailable entity as resolved', () => {
    expect(leftOnRule(doorRule, door('unavailable'), NOW).resolvedIds).toEqual([])
    expect(leftOnRule(doorRule, door('unknown'), NOW).resolvedIds).toEqual([])
  })
})

describe('left-on confirm', () => {
  it("names the confirm for a toggle rule that isn't a door from its action", () => {
    const rule = { ...heaterRule, action: { ...heaterRule.action, service: 'toggle' } }
    const { action } = leftOnRule(rule, heater('on', 60), NOW).items[0]
    expect(action).toMatchObject({ label: 'Turn off', confirmLabel: 'Confirm turn off' })
  })
})

describe('left-on badge icon', () => {
  it('defaults the badge to the action domain when the rule names no icon', () => {
    const lights = testHomeConfig.leftOnRules.find((r) => r.id === 'bedroom-lightstrip')!
    const vm = switchViewModel(
      lights.entity_id,
      switchState({ entity_id: lights.entity_id, state: 'on', last_changed: minutesAgo(500) }),
    )
    const icon = (rule: typeof lights) => {
      const item = leftOnRule(rule, vm, NOW).items[0]
      return item.kind === 'left-on' ? item.icon : undefined
    }
    expect(icon({ ...lights, icon: undefined })).toBe('light')
    expect(icon({ ...lights, icon: undefined, action: { ...lights.action, domain: 'fan' } })).toBe(
      'fan',
    )
    expect(
      icon({ ...lights, icon: undefined, action: { ...lights.action, domain: 'switch' } }),
    ).toBe('power')
  })
})
