import { describe, expect, it } from 'vitest'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { runScript } from './actions'

describe('script actions', () => {
  it('sends script.turn_on targeting the script', () => {
    const fake = createFakeServiceGateway()
    void runScript(fake.gateway, 'script.goodnight')
    expect(fake.calls).toEqual([
      {
        domain: 'script',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: 'script.goodnight' },
      },
    ])
  })
})
