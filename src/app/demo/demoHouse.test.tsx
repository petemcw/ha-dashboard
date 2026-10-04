import { act, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../config/testHomeConfig'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { renderWithHome } from '../../test/renderWithHome'
import { AttentionHarness } from '../../test/AttentionHarness'
import { FakeHa } from '../../infrastructure/fakeHa/fakeHa'
import { FAVORITES_KEY, parseFavorites } from '../../features/home/favorites/favoritesValue'
import { MediaCard } from '../../features/home/media/MediaCard'
import { SuggestionsStrip } from '../../features/home/suggestions/SuggestionsStrip'
import { SystemsCard } from '../../features/home/systems/SystemsCard'
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

  it('has no pictures for the demo people or media players', () => {
    const people = demoEntities().filter((e) => e.entity_id.startsWith('person.'))
    const players = demoEntities().filter((e) => e.entity_id.startsWith('media_player.'))
    expect(people.length).toBeGreaterThanOrEqual(2)
    expect(players.length).toBeGreaterThanOrEqual(3)
    for (const e of [...people, ...players])
      expect(e.attributes).not.toHaveProperty('entity_picture')
  })

  it('starts the hourly forecast at the current hour, so the Today card leads with Now', () => {
    const now = new Date(2026, 9, 4, 15, 30).getTime()
    const { forecasts } = demoHouse(now)
    const [first] = forecasts![testHomeConfig.weather!.entity_id].hourly as { datetime: string }[]
    expect(new Date(first.datetime)).toEqual(new Date(2026, 9, 4, 15, 0))
  })

  it('sets the sun in the evening, tomorrow once this evening has passed', () => {
    const sunset = (now: Date) =>
      demoEntities(now.getTime()).find((e) => e.entity_id === testHomeConfig.weather!.sun)
        ?.attributes.next_setting
    expect(new Date(sunset(new Date(2026, 9, 4, 10, 0)))).toEqual(new Date(2026, 9, 4, 18, 50))
    expect(new Date(sunset(new Date(2026, 9, 4, 21, 0)))).toEqual(new Date(2026, 9, 5, 18, 50))
  })

  it('backs up overnight, so the last backup reads as this morning', () => {
    const backup = (now: Date) =>
      demoEntities(now.getTime()).find((e) => e.entity_id === testHomeConfig.systems!.backup)?.state
    expect(new Date(backup(new Date(2026, 9, 4, 15, 30))!)).toEqual(new Date(2026, 9, 4, 3, 10))
    // Before tonight's backup has run, the last one is last night's.
    expect(new Date(backup(new Date(2026, 9, 4, 1, 0))!)).toEqual(new Date(2026, 9, 3, 3, 10))
  })

  it('has one of four access points down, so the Systems card reads 3/4', () => {
    seedDemo()
    renderWithHome(<SystemsCard />)
    expect(screen.getByRole('group', { name: 'Access points' })).toHaveTextContent('3/4')
  })

  it('lists the idle and off media players as chips next to the playing one', async () => {
    seedDemo()
    renderWithHome(<MediaCard />)
    const chips = await screen.findAllByRole('listitem')
    expect(chips.map((c) => c.textContent)).toEqual([
      'Kitchen speaker · Off',
      'Family room TV · Off',
      'Receiver · Idle',
    ])
    expect(screen.getByText('1 playing')).toBeInTheDocument()
  })
})
