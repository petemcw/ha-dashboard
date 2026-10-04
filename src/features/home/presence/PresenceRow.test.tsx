import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { personState } from '../../../domains/person/factories'
import { entityState } from '../../../domains/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { renderWithHome } from '../../../test/renderWithHome'
import { PresenceRow } from './PresenceRow'

beforeEach(() => vi.stubEnv('VITE_HA_URL', 'https://ha.example'))
afterEach(() => {
  entityStore.reset()
  vi.unstubAllEnvs()
})

const person = (id: string, name: string, state = 'home') =>
  personState({ entity_id: `person.${id}`, friendly_name: name, state })

const load = (...entities: ReturnType<typeof entityState>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

const names = async () =>
  (await screen.findAllByRole('listitem')).map((li) => li.getAttribute('aria-label')?.split(',')[0])

describe('presence row', () => {
  it('says so when Home Assistant has no people', async () => {
    load(entityState({ entity_id: 'light.porch', state: 'on' }))
    renderWithHome(<PresenceRow />)
    expect(await screen.findByText('No people in Home Assistant yet')).toBeInTheDocument()
  })

  it('shows every person Home Assistant knows about, sorted by name', async () => {
    load(
      person('zed_zebra', 'Zed Zebra'),
      person('sam_quinn', 'Sam Quinn'),
      person('alex_rivera', 'Alex Rivera'),
      entityState({ entity_id: 'light.porch', state: 'on' }),
    )
    renderWithHome(<PresenceRow />)
    expect(await names()).toEqual(['Alex Rivera', 'Sam Quinn', 'Zed Zebra'])
  })

  it('sorts a person without a friendly name by entity id', async () => {
    load(person('b_two', 'Zed'), entityState({ entity_id: 'person.a_one', state: 'home' }))
    renderWithHome(<PresenceRow />)
    expect(await names()).toEqual(['a one', 'Zed'])
  })

  it('shows a person who appears in Home Assistant later', async () => {
    load(person('alex_rivera', 'Alex Rivera'))
    renderWithHome(<PresenceRow />)
    await names()
    load(person('alex_rivera', 'Alex Rivera'), person('blair_kim', 'Blair Kim'))
    expect(await names()).toEqual(['Alex Rivera', 'Blair Kim'])
  })

  it('uses the people listed in home.json in that order when present', async () => {
    load(person('alex_rivera', 'Alex Rivera'), person('blair_kim', 'Blair Kim'))
    renderWithHome(<PresenceRow />, {
      config: { ...testHomeConfig, people: ['person.blair_kim', 'person.alex_rivera'] },
    })
    expect(await names()).toEqual(['Blair Kim', 'Alex Rivera'])
  })

  it('shows a listed person that Home Assistant does not have as missing', async () => {
    load(person('alex_rivera', 'Alex Rivera'))
    renderWithHome(<PresenceRow />, {
      config: { ...testHomeConfig, people: ['person.alex_rivera', 'person.ghost'] },
    })
    const row = await screen.findByRole('list')
    expect(within(row).getByRole('listitem', { name: 'ghost, missing' })).toBeInTheDocument()
  })
})
