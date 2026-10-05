import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entityState } from '../../domains/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'
import {
  registryStore,
  resetRegistryStore,
  type RegistryState,
} from '../../infrastructure/registries/registryStore'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { renderWithHome } from '../../test/renderWithHome'
import { RoomCard } from './RoomCard'
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

const registries = (entityIds: string[], area: object = {}) =>
  ({
    kind: 'ready',
    registries: {
      floors: [],
      areas: [{ areaId: 'kitchen', name: 'Kitchen', icon: 'mdi:countertop', ...area }],
      devices: [],
      entities: entityIds.map((id) => placed(id, 'kitchen')),
    },
  }) as RegistryState

const seed = (...entities: ReturnType<typeof entityState>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

beforeEach(() => {
  setConnected()
})

afterEach(() => {
  resetRoomSelection()
  resetRegistryStore()
  entityStore.reset()
  resetConnectionStatus()
  localStorage.clear()
})

describe('RoomCard', () => {
  it('shows the resolved room as a card named by the room', () => {
    seed(entityState({ entity_id: 'light.ceiling', state: 'on' }))
    registryStore.set(registries(['light.ceiling']))
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    renderWithHome(<RoomCard />)
    expect(screen.getByRole('region', { name: 'Kitchen' })).toBeInTheDocument()
  })

  it('shows no room card when nothing is resolved', () => {
    seed(entityState({ entity_id: 'light.ceiling', state: 'on' }))
    registryStore.set(registries(['light.ceiling']))
    const { container } = renderWithHome(<RoomCard />)
    expect(container).toBeEmptyDOMElement()
  })

  it("shows the room's temperature and humidity in the card header when the area has them", () => {
    seed(
      entityState({ entity_id: 'light.ceiling', state: 'on' }),
      entityState({
        entity_id: 'sensor.kitchen_temp',
        state: '21.5',
        attributes: { unit_of_measurement: '°C' },
      }),
      entityState({
        entity_id: 'sensor.kitchen_humidity',
        state: '40',
        attributes: { unit_of_measurement: '%' },
      }),
    )
    registryStore.set(
      registries(['light.ceiling'], {
        temperatureEntityId: 'sensor.kitchen_temp',
        humidityEntityId: 'sensor.kitchen_humidity',
      }),
    )
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    renderWithHome(<RoomCard />)
    const card = screen.getByRole('region', { name: 'Kitchen' })
    expect(within(card).getByText('21.5°C')).toBeInTheDocument()
    expect(within(card).getByText('40%')).toBeInTheDocument()
  })

  it('shows a header reading as unavailable or missing instead of a number', () => {
    seed(
      entityState({ entity_id: 'light.ceiling', state: 'on' }),
      entityState({ entity_id: 'sensor.kitchen_temp', state: 'unavailable' }),
    )
    registryStore.set(
      registries(['light.ceiling'], {
        temperatureEntityId: 'sensor.kitchen_temp',
        humidityEntityId: 'sensor.kitchen_humidity',
      }),
    )
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    renderWithHome(<RoomCard />)
    const card = screen.getByRole('region', { name: 'Kitchen' })
    expect(within(card).getByText('Unavailable')).toBeInTheDocument()
    expect(within(card).getByText('Missing')).toBeInTheDocument()
  })

  it("renders a tile for every entity in the room in the room's order", () => {
    seed(
      entityState({
        entity_id: 'light.ceiling',
        state: 'on',
        attributes: { friendly_name: 'Ceiling' },
      }),
      entityState({
        entity_id: 'switch.kettle',
        state: 'off',
        attributes: { friendly_name: 'Kettle' },
      }),
      entityState({
        entity_id: 'scene.cozy',
        state: 'unknown',
        attributes: { friendly_name: 'Cozy' },
      }),
    )
    // The registry lists them out of order; the room model orders by kind.
    registryStore.set(registries(['scene.cozy', 'switch.kettle', 'light.ceiling', 'script.gone']))
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    renderWithHome(<RoomCard />)
    const card = screen.getByRole('region', { name: 'Kitchen' })
    // script.gone isn't live, so the room model leaves it out.
    expect(
      within(card)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([
      expect.stringContaining('Ceiling'),
      expect.stringContaining('Kettle'),
      expect.stringContaining('Cozy'),
    ])
  })

  it('toggles a light in the room card with an explicit turn_off', async () => {
    seed(
      entityState({
        entity_id: 'light.ceiling',
        state: 'on',
        attributes: { friendly_name: 'Ceiling' },
      }),
    )
    registryStore.set(registries(['light.ceiling']))
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    const { gateway, calls } = createFakeServiceGateway()
    renderWithHome(<RoomCard />, { gateway })
    await userEvent.click(screen.getByRole('button', { name: /Ceiling/ }))
    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_off',
        data: undefined,
        target: { entity_id: 'light.ceiling' },
      },
    ])
  })

  it('shows covers, climate, and locks without controls', () => {
    seed(
      entityState({
        entity_id: 'cover.shade',
        state: 'open',
        attributes: { friendly_name: 'Shade' },
      }),
      entityState({
        entity_id: 'climate.heat',
        state: 'heat',
        attributes: { friendly_name: 'Heat' },
      }),
      entityState({
        entity_id: 'lock.door',
        state: 'locked',
        attributes: { friendly_name: 'Door' },
      }),
    )
    registryStore.set(registries(['cover.shade', 'climate.heat', 'lock.door']))
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    renderWithHome(<RoomCard />)
    const card = screen.getByRole('region', { name: 'Kitchen' })
    expect(within(card).getAllByRole('listitem')).toHaveLength(3)
    expect(within(card).queryAllByRole('button')).toEqual([])
    expect(card).toHaveTextContent('locked')
  })

  it('asks for a second tap on a confirm-listed room tile', async () => {
    seed(
      entityState({
        entity_id: 'switch.garage_door_opener',
        state: 'off',
        attributes: { friendly_name: 'Garage opener' },
      }),
    )
    registryStore.set(registries(['switch.garage_door_opener']))
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    const { gateway, calls } = createFakeServiceGateway()
    renderWithHome(<RoomCard />, { gateway })
    await userEvent.click(screen.getByRole('button', { name: /Garage opener/ }))
    expect(calls).toEqual([])
    expect(
      screen.getByRole('button', { name: 'Confirm: turn on Garage opener' }),
    ).toBeInTheDocument()
  })

  it('shows media players in a media section with transport controls instead of plain tiles', async () => {
    seed(
      entityState({
        entity_id: 'light.ceiling',
        state: 'on',
        attributes: { friendly_name: 'Ceiling' },
      }),
      entityState({
        entity_id: 'media_player.kitchen',
        state: 'playing',
        attributes: {
          friendly_name: 'Kitchen speaker',
          media_title: 'Blue Train',
          supported_features: 1,
        },
      }),
    )
    registryStore.set(registries(['light.ceiling', 'media_player.kitchen']))
    selectRoom({ kind: 'room', areaId: 'kitchen' })
    const { gateway, calls } = createFakeServiceGateway()
    renderWithHome(<RoomCard />, { gateway })
    const card = screen.getByRole('region', { name: 'Kitchen' })
    expect(within(card).getByText('Blue Train')).toBeInTheDocument()
    expect(
      within(card)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([expect.stringContaining('Ceiling'), ''])
    await userEvent.click(within(card).getByRole('button', { name: 'Pause Kitchen speaker' }))
    expect(calls.map((c) => c.service)).toEqual(['media_pause'])
  })
})
