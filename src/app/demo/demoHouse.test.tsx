import { act, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../config/testHomeConfig'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { renderWithHome } from '../../test/renderWithHome'
import { AttentionHarness } from '../../test/AttentionHarness'
import { FakeHa } from '../../infrastructure/fakeHa/fakeHa'
import { FAVORITES_KEY, parseFavorites } from '../../features/home/favorites/favoritesValue'
import { SuggestionsStrip } from '../../features/home/suggestions/SuggestionsStrip'
import { demoEntities, demoHouse, FAVORITE_IDS } from './demoHouse'

afterEach(() => {
  entityStore.reset()
  vi.useRealTimers()
})

// A client of the demo's fake HA that records what it hears.
function demoClient() {
  const ha = new FakeHa(demoHouse())
  const received: Record<string, unknown>[] = []
  const client = ha.connect((m) => received.push(m as never))
  let id = 0
  const callService = (domain: string, service: string, entity_id: string) =>
    ha.receive(client, { id: ++id, type: 'call_service', domain, service, target: { entity_id } })
  return { ha, received, callService }
}

const seedDemo = () =>
  act(() =>
    entityStore.setEntities(Object.fromEntries(demoEntities().map((e) => [e.entity_id, e]))),
  )

describe('the demo house', () => {
  it('shows at least one urgent attention item and one chore', () => {
    seedDemo()
    renderWithHome(<AttentionHarness />)
    expect(screen.getByText('Garage door')).toBeInTheDocument()
    expect(screen.getByText('Space heater')).toBeInTheDocument()
    const chores = screen.getByRole('list', { name: 'Chores' })
    expect(chores).toHaveTextContent('Furnace filter')
    expect(chores).toHaveTextContent('Hallway sensor battery')
  })

  it('seeds favorites with a light, a switch, a fan, a scene, and a script', () => {
    const ha = new FakeHa(demoHouse())
    const received: { result?: { value: unknown } }[] = []
    const client = ha.connect((m) => received.push(m as never))
    ha.receive(client, { id: 1, type: 'frontend/get_user_data', key: FAVORITES_KEY })
    const { entityIds } = parseFavorites(received[0].result?.value)
    expect(entityIds.map((id) => id.split('.')[0]).sort()).toEqual([
      'fan',
      'light',
      'scene',
      'script',
      'switch',
    ])
    for (const id of entityIds) expect(ha.getState(id)).toBeDefined()
  })

  it('plays the suggestion player so a suggestion shows', () => {
    seedDemo()
    renderWithHome(<SuggestionsStrip />)
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeInTheDocument()
  })

  it('turns the demo light on after the delay when it is tapped', () => {
    vi.useFakeTimers()
    const { ha, callService } = demoClient()
    callService('light', 'toggle', 'light.living_room_lamp')
    expect(ha.getState('light.living_room_lamp')?.state).toBe('off')
    vi.advanceTimersByTime(600)
    expect(ha.getState('light.living_room_lamp')?.state).toBe('on')
  })

  it('contains every entity a demo control targets', () => {
    const ids = new Set(demoEntities().map((e) => e.entity_id))
    const { leftOnRules, filterRules, suggestions } = testHomeConfig
    const targets = [
      ...leftOnRules.map((r) => r.action.entity_id),
      ...filterRules.map((r) => r.resetScript),
      suggestions.playing.scene,
      suggestions.paused.scene,
      ...FAVORITE_IDS,
    ]
    expect(targets.filter((t) => !ids.has(t))).toEqual([])
  })

  it('closes the demo garage door sensor when the garage opener is toggled', () => {
    vi.useFakeTimers()
    const { ha, callService } = demoClient()
    callService('switch', 'toggle', 'switch.garage_door_opener')
    vi.advanceTimersByTime(600)
    expect(ha.getState('binary_sensor.garage_door')?.state).toBe('off')
  })

  it("clears a filter's chore when its reset script runs", () => {
    vi.useFakeTimers()
    const { ha, callService } = demoClient()
    const [filter] = testHomeConfig.filterRules
    callService('script', 'turn_on', filter.resetScript)
    vi.advanceTimersByTime(600)
    expect(Number(ha.getState(filter.entity_id)?.state)).toBeGreaterThan(filter.belowDays)
  })

  it('has no pictures for the demo people', () => {
    const people = demoEntities().filter((e) => e.entity_id.startsWith('person.'))
    expect(people.length).toBeGreaterThanOrEqual(2)
    for (const p of people) expect(p.attributes).not.toHaveProperty('entity_picture')
  })
})
