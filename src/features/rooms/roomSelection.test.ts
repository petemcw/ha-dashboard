import { describe, expect, it } from 'vitest'
import type { Registries } from '../../infrastructure/registries/registries'
import { personState } from '../../domains/person/factories'
import { personViewModel } from '../../domains/person/viewModel'
import { awaySource } from './roomSources'
import { buildRooms } from './roomModel'
import { resolveRoom, type RoomSourceContext } from './roomSelection'

const registries: Registries = {
  floors: [],
  areas: [
    { areaId: 'living_room', name: 'Living Room' },
    { areaId: 'garage', name: 'Garage' },
  ],
  devices: [],
  entities: [
    { entityId: 'light.lamp', areaId: 'living_room', hidden: false, category: false },
    { entityId: 'switch.opener', areaId: 'garage', hidden: false, category: false },
  ],
}
const rooms = buildRooms(
  registries,
  new Set(['light.lamp', 'switch.opener']),
  { hidden: [], areas: {} },
  (id) => id,
)
const ctx: RoomSourceContext = { rooms, persons: [], kiosk: false }

describe('resolveRoom', () => {
  it('shows the picked room when the pick is a current room', () => {
    const resolved = resolveRoom({ kind: 'room', areaId: 'garage' }, ctx, [])
    expect(resolved.kind).toBe('room')
    if (resolved.kind === 'room') {
      expect(resolved.room.name).toBe('Garage')
      expect(resolved.reason).toBeUndefined()
    }
  })

  it('treats a pick whose area is no longer a room as Auto', () => {
    const source = { id: 'test', resolve: () => ({ areaId: 'living_room', reason: 'because' }) }
    const resolved = resolveRoom({ kind: 'room', areaId: 'deleted_area' }, ctx, [source])
    expect(resolved).toMatchObject({
      kind: 'room',
      selection: { kind: 'room', areaId: 'deleted_area' },
      room: { areaId: 'living_room' },
      reason: 'because',
    })
  })
})

const personAt = (state: string, user_id: string | null = 'u1') =>
  personViewModel(
    personState({ state, user_id: user_id ?? undefined }),
    'person.alex_rivera',
    'https://ha.example.test',
  )
const autoWith = (extra: Partial<RoomSourceContext>) =>
  resolveRoom({ kind: 'auto' }, { ...ctx, awayRoom: 'garage', currentUserId: 'u1', ...extra }, [
    awaySource,
  ])

describe('the away source under Auto', () => {
  it('shows the away room under Auto when the signed-in person is not home', () => {
    const resolved = autoWith({ persons: [personAt('not_home')] })
    expect(resolved).toMatchObject({
      kind: 'room',
      room: { areaId: 'garage' },
      reason: "you're away",
    })
  })

  it("shows no room under Auto on a kiosk even when the signed-in user's person is away", () => {
    const resolved = autoWith({ persons: [personAt('not_home')], kiosk: true })
    expect(resolved.kind).toBe('none')
  })

  it('shows no room under Auto when the signed-in person is home or has unknown presence', () => {
    for (const state of ['home', 'unknown', 'unavailable']) {
      expect(autoWith({ persons: [personAt(state)] }).kind).toBe('none')
    }
  })

  it('shows no room under Auto when the signed-in user has no person', () => {
    expect(autoWith({ persons: [personAt('not_home', 'someone_else')] }).kind).toBe('none')
    expect(autoWith({ persons: [personAt('not_home', null)] }).kind).toBe('none')
    expect(autoWith({ persons: [] }).kind).toBe('none')
  })

  it('shows no room under Auto when no away room is configured', () => {
    expect(autoWith({ persons: [personAt('not_home')], awayRoom: undefined }).kind).toBe('none')
  })
})
