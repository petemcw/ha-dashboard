import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entityState } from '../../domains/factories'
import { personState } from '../../domains/person/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'
import {
  registryStore,
  resetRegistryStore,
  type RegistryState,
} from '../../infrastructure/registries/registryStore'
import { ROOM_SELECTION_KEY } from '../../infrastructure/storageKeys'
import { renderWithHome } from '../../test/renderWithHome'
import { RoomSelector } from './RoomSelector'
import { resetRoomSelection, selectRoom } from './roomSelectionStore'

vi.mock('../../infrastructure/ha/useCurrentUser', () => ({
  useCurrentUser: () => ({ id: 'u1', isAdmin: false }),
}))

const placed = (entityId: string, areaId: string) => ({
  entityId,
  areaId,
  hidden: false,
  category: false,
})

const ready: RegistryState = {
  kind: 'ready',
  registries: {
    floors: [
      { floorId: 'up', name: 'Upstairs', level: 1 },
      { floorId: 'ground', name: 'Ground Floor', level: 0 },
    ],
    areas: [
      { areaId: 'bedroom', name: 'Bedroom', floorId: 'up', icon: 'mdi:bed' },
      { areaId: 'kitchen', name: 'Kitchen', floorId: 'ground', icon: 'mdi:countertop' },
      { areaId: 'living_room', name: 'Living Room', floorId: 'ground' },
      { areaId: 'garage', name: 'Garage' },
    ],
    devices: [],
    entities: [
      placed('light.bed', 'bedroom'),
      placed('light.kitchen', 'kitchen'),
      placed('light.lamp', 'living_room'),
      placed('light.garage', 'garage'),
    ],
  },
}

const lights = Object.fromEntries(
  ['light.bed', 'light.kitchen', 'light.lamp', 'light.garage'].map((id) => [
    id,
    entityState({ entity_id: id, state: 'on' }),
  ]),
)

beforeEach(() => {
  registryStore.set(ready)
  entityStore.setEntities({ ...lights, 'person.alex': personState({ entity_id: 'person.alex' }) })
})

afterEach(() => {
  resetRoomSelection()
  resetRegistryStore()
  entityStore.reset()
  localStorage.clear()
})

describe('RoomSelector', () => {
  it('names the selector with the current choice and what Auto picked', () => {
    // Away: Auto picks the configured away room (the test house's is the garage).
    entityStore.setEntities({
      ...lights,
      'person.alex': personState({ entity_id: 'person.alex', state: 'not_home', user_id: 'u1' }),
    })
    renderWithHome(<RoomSelector />)
    const button = screen.getByRole('button', {
      name: "Room: Auto, showing Garage because you're away",
    })
    expect(button).toHaveTextContent("Room · Auto · Garage, you're away")
  })

  it('lists Auto first and then rooms grouped under floor headings in floor order', async () => {
    renderWithHome(<RoomSelector />)
    await userEvent.setup().click(screen.getByRole('button', { name: /^Room: Auto/ }))
    const dialog = screen.getByRole('dialog', { name: 'Room' })
    const group = within(dialog).getByRole('radiogroup', { name: 'Room' })
    expect(
      within(dialog)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Ground Floor', 'Upstairs', 'Other'])
    expect(
      within(group)
        .getAllByRole('radio')
        .map((r) => r.closest('label')?.textContent),
    ).toEqual(['Auto', 'Kitchen', 'Living Room', 'Bedroom', 'Garage'])
  })

  it('marks the current choice in the picker', async () => {
    const user = userEvent.setup()
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    renderWithHome(<RoomSelector />)
    await user.click(screen.getByRole('button', { name: 'Room: Kitchen' }))
    expect(screen.getByRole('radio', { name: 'Kitchen' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Auto' })).not.toBeChecked()
  })

  it('selects a room from the picker and closes the sheet', async () => {
    const user = userEvent.setup()
    renderWithHome(<RoomSelector />)
    await user.click(screen.getByRole('button', { name: /^Room: Auto/ }))
    await user.click(screen.getByRole('radio', { name: 'Bedroom' }))
    expect(localStorage.getItem(ROOM_SELECTION_KEY)).toBe('bedroom')
    expect(screen.getByRole('button', { name: 'Room: Bedroom' })).toHaveTextContent(
      'Room · Bedroom',
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('hides the selector while rooms load or when the registries fail', () => {
    resetRegistryStore()
    const { container, rerender } = renderWithHome(<RoomSelector />)
    expect(container).toBeEmptyDOMElement()
    act(() => registryStore.set({ kind: 'error' }))
    rerender(<RoomSelector />)
    expect(container).toBeEmptyDOMElement()
  })

  it('hides the selector when the house has no rooms', () => {
    act(() =>
      registryStore.set({
        kind: 'ready',
        registries: { ...ready.registries, areas: [] },
      } as RegistryState),
    )
    const { container } = renderWithHome(<RoomSelector />)
    expect(container).toBeEmptyDOMElement()
  })
})
