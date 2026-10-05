import { describe, expect, it } from 'vitest'
import { lightState } from '../../domains/light/factories'
import { entityState } from '../../domains/factories'
import { entitySearch } from './searchEntities'

const kitchen = lightState({
  entity_id: 'light.kitchen_main',
  attributes: { friendly_name: 'Kitchen Ceiling' },
})

describe('favorites search', () => {
  it('finds entities by friendly name or entity ID', () => {
    expect(entitySearch('ceiling', [])?.(kitchen)).toBe(true)
    expect(entitySearch('KITCHEN_MAIN', [])?.(kitchen)).toBe(true)
    expect(entitySearch('garage', [])?.(kitchen)).toBe(false)
  })

  it('offers nothing, with no predicate to scan with, for a blank query', () => {
    expect(entitySearch('  ', [])).toBeNull()
    expect(entitySearch('', [])).toBeNull()
  })

  it('only offers entities from controllable domains', () => {
    const sensor = entityState({
      entity_id: 'sensor.kitchen_temp',
      attributes: { friendly_name: 'Kitchen temp' },
    })
    expect(entitySearch('kitchen', [])?.(sensor)).toBe(false)
  })

  it('does not offer an entity that is already a favorite', () => {
    expect(entitySearch('kitchen', ['light.kitchen_main'])?.(kitchen)).toBe(false)
  })
})

describe('favorites search for helpers', () => {
  it('lets the favorites editor add an input_boolean', () => {
    const helper = entityState({
      entity_id: 'input_boolean.guest_mode',
      attributes: { friendly_name: 'Guest mode' },
    })
    expect(entitySearch('guest', [])?.(helper)).toBe(true)
  })
})
