import { describe, expect, it } from 'vitest'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { runEntityAction } from './actions'

describe('generic entity actions', () => {
  it('sends the given domain and service targeting the entity', () => {
    const fake = createFakeServiceGateway()
    void runEntityAction(fake.gateway, {
      domain: 'switch',
      service: 'toggle',
      entity_id: 'switch.opener',
    })
    expect(fake.calls).toEqual([
      {
        domain: 'switch',
        service: 'toggle',
        data: undefined,
        target: { entity_id: 'switch.opener' },
      },
    ])
  })
})
