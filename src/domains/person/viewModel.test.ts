import { describe, expect, it } from 'vitest'
import { personState } from './factories'
import { personViewModel } from './viewModel'

const HA = 'https://ha.example.test'

describe('personViewModel', () => {
  it('shows a person at home as home', () => {
    const vm = personViewModel(personState({ state: 'home' }), 'person.alex_rivera', HA)
    expect(vm.presence).toBe('home')
    expect(vm.name).toBe('Alex Rivera')
    expect(vm.initials).toBe('AR')
  })

  it('gives a short first name for the label under the avatar', () => {
    expect(personViewModel(personState(), 'person.alex_rivera', HA).shortName).toBe('Alex')
    // A missing person's name comes from the id, lower case; the label still reads as a name.
    expect(personViewModel(undefined, 'person.sam_quinn', HA).shortName).toBe('Sam')
  })

  it('shows a person who is not_home as away', () => {
    const vm = personViewModel(personState({ state: 'not_home' }), 'person.alex_rivera', HA)
    expect(vm.presence).toBe('away')
  })

  it('shows the zone name when a person is in a named zone', () => {
    const vm = personViewModel(personState({ state: 'Work' }), 'person.alex_rivera', HA)
    expect(vm.presence).toBe('zone')
    expect(vm.zoneName).toBe('Work')
  })

  it('shows a person with an unknown state as location unknown', () => {
    const vm = personViewModel(personState({ state: 'unknown' }), 'person.alex_rivera', HA)
    expect(vm.presence).toBe('unknown')
  })

  it('shows an unavailable person as unavailable', () => {
    const vm = personViewModel(personState({ state: 'unavailable' }), 'person.alex_rivera', HA)
    expect(vm.presence).toBe('unavailable')
  })

  it("resolves the person's picture against the Home Assistant URL", () => {
    const entity = personState({ entity_picture: '/api/image/serve/abc/512x512' })
    expect(personViewModel(entity, 'person.alex_rivera', HA).pictureUrl).toBe(
      'https://ha.example.test/api/image/serve/abc/512x512',
    )
    expect(personViewModel(entity, 'person.alex_rivera', `${HA}/`).pictureUrl).toBe(
      'https://ha.example.test/api/image/serve/abc/512x512',
    )
  })

  it('has no picture url when the person has no picture', () => {
    expect(personViewModel(personState(), 'person.alex_rivera', HA).pictureUrl).toBeUndefined()
  })

  it('shows a configured person missing from Home Assistant as missing', () => {
    const vm = personViewModel(undefined, 'person.sam_quinn', HA)
    expect(vm.presence).toBe('missing')
    expect(vm.name).toBe('sam quinn')
    expect(vm.initials).toBe('SQ')
  })

  it('takes initials from the first and last words of a name', () => {
    const vm = personViewModel(personState({ friendly_name: 'ann marie  Smith' }), 'person.ann', HA)
    expect(vm.initials).toBe('AS')
    const single = personViewModel(personState({ friendly_name: 'Madonna' }), 'person.m', HA)
    expect(single.initials).toBe('M')
  })
})
