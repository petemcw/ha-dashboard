import { describe, expect, it } from 'vitest'
import { sunState } from './factories'
import { sunViewModel } from './viewModel'

describe('sunViewModel', () => {
  it('reads the next setting time from the sun entity', () => {
    const vm = sunViewModel(sunState('2026-10-03T23:52:00+00:00'))
    expect(vm.status).toBe('ok')
    expect(vm.nextSetting?.toISOString()).toBe('2026-10-03T23:52:00.000Z')
  })

  it('has no setting time when the attribute is absent or not a date', () => {
    expect(sunViewModel(sunState(undefined)).nextSetting).toBeUndefined()
    expect(sunViewModel(sunState('soon')).nextSetting).toBeUndefined()
  })

  it('is missing when the sun entity does not exist', () => {
    expect(sunViewModel(undefined, 'sun.sun')).toMatchObject({ status: 'missing' })
  })

  it('has no setting time while unavailable', () => {
    const vm = sunViewModel(sunState('2026-10-03T23:52:00+00:00', 'unavailable'))
    expect(vm.status).toBe('unavailable')
    expect(vm.nextSetting).toBeUndefined()
  })
})
