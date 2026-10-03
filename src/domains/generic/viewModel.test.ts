import { describe, expect, it } from 'vitest'
import { entityState } from '../factories'
import { stateViewModel } from './viewModel'

describe('generic state view model', () => {
  it('passes HA state text through for a present entity', () => {
    const vm = stateViewModel('lock.d', entityState({ entity_id: 'lock.d', state: 'locked' }))
    expect(vm).toEqual({ entity_id: 'lock.d', status: 'ok', state: 'locked' })
  })
  it.each(['unavailable', 'unknown'])('reports %s without a value', (state) => {
    const vm = stateViewModel('lock.d', entityState({ entity_id: 'lock.d', state }))
    expect(vm).toEqual({ entity_id: 'lock.d', status: state })
  })
  it('reports a missing entity', () => {
    expect(stateViewModel('lock.d', undefined).status).toBe('missing')
  })
})
