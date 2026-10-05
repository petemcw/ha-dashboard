import { describe, expect, it } from 'vitest'
import { PLACEHOLDER_AREAS, placeRegistries } from './placeholderRegistries.ts'

describe('placeRegistries', () => {
  it('builds placeholder entity records in their areas directly or through their device', () => {
    const { devices, entityRegistry } = placeRegistries({
      kitchen: ['light.kitchen_pendant', 'switch.kettle'],
    })
    const [direct, viaDevice] = entityRegistry.entities
    expect(direct).toMatchObject({ ei: 'light.kitchen_pendant', ai: 'kitchen' })
    expect(direct).not.toHaveProperty('di')
    expect(viaDevice).toMatchObject({ ei: 'switch.kettle' })
    expect(viaDevice).not.toHaveProperty('ai')
    expect(devices).toEqual([expect.objectContaining({ area_id: 'kitchen' })])
    expect(devices[0].id).toBe(viaDevice.di)
  })

  it('lists the shared placeholder areas', () => {
    expect(PLACEHOLDER_AREAS.map((a) => a.area_id)).toEqual([
      'living_room',
      'kitchen',
      'bedroom',
      'office',
      'garage',
      'porch',
      'storage',
    ])
  })
})
