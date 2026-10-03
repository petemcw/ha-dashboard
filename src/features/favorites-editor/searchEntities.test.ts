import { describe, expect, it } from 'vitest'
import { lightState } from '../../domains/light/factories'
import { entityState } from '../../domains/factories'
import { matchesSearch } from './searchEntities'

const kitchen = lightState({
  entity_id: 'light.kitchen_main',
  attributes: { friendly_name: 'Kitchen Ceiling' },
})

describe('favorites search', () => {
  it('finds entities by friendly name or entity ID', () => {
    expect(matchesSearch(kitchen, 'ceiling', [])).toBe(true)
    expect(matchesSearch(kitchen, 'KITCHEN_MAIN', [])).toBe(true)
    expect(matchesSearch(kitchen, 'garage', [])).toBe(false)
    expect(matchesSearch(kitchen, '  ', [])).toBe(false)
  })

  it('only offers entities from controllable domains', () => {
    const sensor = entityState({
      entity_id: 'sensor.kitchen_temp',
      attributes: { friendly_name: 'Kitchen temp' },
    })
    expect(matchesSearch(sensor, 'kitchen', [])).toBe(false)
  })

  it('does not offer an entity that is already a favorite', () => {
    expect(matchesSearch(kitchen, 'kitchen', ['light.kitchen_main'])).toBe(false)
  })
})
