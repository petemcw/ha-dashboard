import { describe, expect, it } from 'vitest'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { activateScene } from './actions'

describe('scene actions', () => {
  it('sends scene.turn_on with the transition when one is given', () => {
    const fake = createFakeServiceGateway()
    void activateScene(fake.gateway, 'scene.movie', { transition: 5 })
    expect(fake.calls).toEqual([
      {
        domain: 'scene',
        service: 'turn_on',
        data: { transition: 5 },
        target: { entity_id: 'scene.movie' },
      },
    ])
  })

  it('sends scene.turn_on without data when there is no transition', () => {
    const fake = createFakeServiceGateway()
    void activateScene(fake.gateway, 'scene.bright')
    expect(fake.calls[0].data).toBeUndefined()
  })
})
