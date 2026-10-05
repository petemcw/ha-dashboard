import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeConfigProvider } from '../../config/HomeConfigProvider'
import { testHomeConfig } from '../../config/testHomeConfig'
import { entityState } from '../../domains/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { registryStore, resetRegistryStore } from '../../infrastructure/registries/registryStore'
import { ROOM_SELECTION_KEY } from '../../infrastructure/storageKeys'
import { resetRoomSelection } from './roomSelectionStore'
import { useSelectedRoom } from './useSelectedRoom'

vi.mock('../../infrastructure/ha/useCurrentUser', () => ({
  useCurrentUser: () => ({ id: 'u1', isAdmin: false }),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <HomeConfigProvider config={testHomeConfig}>{children}</HomeConfigProvider>
)

beforeEach(() => {
  registryStore.set({
    kind: 'ready',
    registries: {
      floors: [],
      areas: [
        { areaId: 'living_room', name: 'Living Room' },
        { areaId: 'bedroom', name: 'Bedroom' },
      ],
      devices: [],
      entities: [
        { entityId: 'light.lamp', areaId: 'living_room', hidden: false, category: false },
        { entityId: 'light.bed', areaId: 'bedroom', hidden: false, category: false },
      ],
    },
  })
  entityStore.setEntities({
    'light.lamp': entityState({ entity_id: 'light.lamp', state: 'on' }),
    'light.bed': entityState({ entity_id: 'light.bed', state: 'on' }),
  })
})

afterEach(() => {
  resetRoomSelection()
  resetRegistryStore()
  entityStore.reset()
  localStorage.clear()
})

describe('useSelectedRoom', () => {
  it('remembers the pick on this device across a reload and defaults to Auto', () => {
    const first = renderHook(() => useSelectedRoom(), { wrapper })
    expect(first.result.current.resolved).toMatchObject({
      kind: 'none',
      selection: { kind: 'auto' },
    })

    act(() => first.result.current.select({ kind: 'room', areaId: 'bedroom' }))
    expect(localStorage.getItem(ROOM_SELECTION_KEY)).toBe('bedroom')
    first.unmount()

    // A reload: the in-memory store is gone, only localStorage remains.
    resetRoomSelection()
    const second = renderHook(() => useSelectedRoom(), { wrapper })
    expect(second.result.current.resolved).toMatchObject({
      kind: 'room',
      room: { areaId: 'bedroom' },
    })

    act(() => second.result.current.select({ kind: 'auto' }))
    expect(localStorage.getItem(ROOM_SELECTION_KEY)).toBeNull()
  })

  it('shows a pick made through one useSelectedRoom caller to every other caller', () => {
    const selector = renderHook(() => useSelectedRoom(), { wrapper })
    const card = renderHook(() => useSelectedRoom(), { wrapper })

    act(() => selector.result.current.select({ kind: 'room', areaId: 'living_room' }))

    expect(card.result.current.resolved).toMatchObject({
      kind: 'room',
      room: { areaId: 'living_room' },
    })
  })

  it('falls back to Auto in memory when storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useSelectedRoom(), { wrapper })
    act(() => result.current.select({ kind: 'room', areaId: 'bedroom' }))
    expect(result.current.resolved).toMatchObject({ kind: 'room', room: { areaId: 'bedroom' } })
    vi.restoreAllMocks()
  })

  it('resolves to undefined while the registries have not loaded', () => {
    resetRegistryStore()
    const { result } = renderHook(() => useSelectedRoom(), { wrapper })
    expect(result.current.resolved).toBeUndefined()
  })
})
