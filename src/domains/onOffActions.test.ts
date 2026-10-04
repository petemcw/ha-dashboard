import { describe, expect, it } from 'vitest'
import { createFakeServiceGateway } from '../test/fakeServiceGateway'
import { setOnOff } from './onOffActions'

describe('on/off actions', () => {
  it('sends turn_on in the entity domain, targeting the entity', () => {
    const fake = createFakeServiceGateway()
    void setOnOff(fake.gateway, 'light.kitchen', true)
    expect(fake.calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: 'light.kitchen' },
      },
    ])
  })

  it('sends turn_off in the entity domain, targeting the entity', () => {
    const fake = createFakeServiceGateway()
    void setOnOff(fake.gateway, 'switch.fan', false)
    expect(fake.calls).toEqual([
      {
        domain: 'switch',
        service: 'turn_off',
        data: undefined,
        target: { entity_id: 'switch.fan' },
      },
    ])
  })

  it('works the same for a fan', () => {
    const fake = createFakeServiceGateway()
    void setOnOff(fake.gateway, 'fan.desk', true)
    expect(fake.calls[0]).toMatchObject({ domain: 'fan', service: 'turn_on' })
  })
})
