import { afterEach, describe, expect, it } from 'vitest'
import { entityState } from '../../domains/factories'
import { entityStore } from './entityStore'
import { readEntityNow } from './readEntityNow'

afterEach(() => entityStore.reset())

describe('readEntityNow', () => {
  it('returns the latest value in the store, and undefined for an entity HA lacks', () => {
    entityStore.setEntities({ 'switch.a': entityState({ entity_id: 'switch.a', state: 'on' }) })
    expect(readEntityNow('switch.a')?.state).toBe('on')
    entityStore.setEntities({ 'switch.a': entityState({ entity_id: 'switch.a', state: 'off' }) })
    expect(readEntityNow('switch.a')?.state).toBe('off')
    expect(readEntityNow('switch.b')).toBeUndefined()
  })
})
