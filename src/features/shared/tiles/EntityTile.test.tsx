import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { CONFIRM_GUARD_MS, CONFIRM_WINDOW_MS } from '../useConfirmArm'
import { entityState } from '../../../domains/factories'
import { inputBooleanState } from '../../../domains/input_boolean/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { renderWithHome } from '../../../test/renderWithHome'
import { EntityTile } from './EntityTile'

const seed = (...entities: ReturnType<typeof inputBooleanState>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

afterEach(() => {
  entityStore.reset()
  resetConnectionStatus()
})

describe('entity tile', () => {
  it('toggles an input_boolean tile with an explicit turn_on or turn_off', async () => {
    seed(
      inputBooleanState({
        entity_id: 'input_boolean.guest_mode',
        state: 'off',
        attributes: { friendly_name: 'Guest mode' },
      }),
    )
    const { gateway, calls, resolve } = createFakeServiceGateway()
    setConnected()
    renderWithHome(<EntityTile entityId="input_boolean.guest_mode" />, { gateway })

    await userEvent.click(screen.getByRole('button', { name: /Guest mode/ }))
    expect(calls).toEqual([
      {
        domain: 'input_boolean',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: 'input_boolean.guest_mode' },
      },
    ])
    await act(async () => resolve())

    seed(
      inputBooleanState({
        entity_id: 'input_boolean.guest_mode',
        state: 'on',
        attributes: { friendly_name: 'Guest mode' },
      }),
    )
    await userEvent.click(screen.getByRole('button', { name: /Guest mode/ }))
    expect(calls[1]).toMatchObject({ domain: 'input_boolean', service: 'turn_off' })
  })

  it('renders the same tile for a light, switch, fan, scene, script, and display-only entity as favorites did', () => {
    seed(
      entityState({ entity_id: 'light.a', state: 'on', attributes: { brightness: 128 } }),
      entityState({ entity_id: 'switch.a', state: 'on' }),
      entityState({ entity_id: 'fan.a', state: 'off' }),
      entityState({ entity_id: 'scene.a', state: '2026-01-01T00:00:00+00:00' }),
      entityState({ entity_id: 'script.a', state: 'off' }),
      entityState({ entity_id: 'lock.a', state: 'locked' }),
    )
    setConnected()
    const ids = ['light.a', 'switch.a', 'fan.a', 'scene.a', 'script.a', 'lock.a']
    renderWithHome(
      <ul>
        {ids.map((id) => (
          <EntityTile key={id} entityId={id} />
        ))}
      </ul>,
      { gateway: createFakeServiceGateway().gateway },
    )
    const tiles = screen.getAllByRole('listitem')
    expect(tiles.map((t) => t.querySelectorAll('button').length)).toEqual([1, 1, 1, 1, 1, 0])
    expect(tiles[0]).toHaveTextContent('On, 50%')
    expect(tiles[5]).toHaveTextContent('locked')
  })

  describe('confirm list', () => {
    const garage = () =>
      seed(
        entityState({
          entity_id: 'switch.garage_door_opener',
          state: 'off',
          attributes: { friendly_name: 'Garage opener' },
        }),
        entityState({
          entity_id: 'switch.lamp',
          state: 'off',
          attributes: { friendly_name: 'Lamp' },
        }),
      )
    const setup = () => {
      garage()
      const fake = createFakeServiceGateway()
      setConnected()
      renderWithHome(
        <ul>
          <EntityTile entityId="switch.garage_door_opener" />
          <EntityTile entityId="switch.lamp" />
        </ul>,
        { gateway: fake.gateway },
      )
      return fake
    }
    // fireEvent, not user-event: its internal delays hang under fake timers.
    const tap = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

    it('arms a confirm-listed tile on the first tap without sending', () => {
      const { calls } = setup()
      tap(/Garage opener/)
      expect(calls).toEqual([])
      const armed = screen.getByRole('button', { name: 'Confirm: turn on Garage opener' })
      expect(armed).toHaveTextContent('Garage opener')
      expect(armed).toHaveTextContent('Confirm?')
    })

    it('sends on the second tap of an armed tile', () => {
      vi.useFakeTimers()
      try {
        const { calls } = setup()
        tap(/Garage opener/)
        vi.advanceTimersByTime(CONFIRM_GUARD_MS + 1)
        tap('Confirm: turn on Garage opener')
        expect(calls).toMatchObject([{ domain: 'switch', service: 'turn_on' }])
      } finally {
        vi.useRealTimers()
      }
    })

    it('disarms an armed tile on a tap elsewhere and after the confirm window', () => {
      vi.useFakeTimers()
      try {
        const { calls } = setup()
        tap(/Garage opener/)
        fireEvent.pointerDown(document.body)
        expect(screen.queryByRole('button', { name: /^Confirm:/ })).not.toBeInTheDocument()

        tap(/Garage opener/)
        act(() => void vi.advanceTimersByTime(CONFIRM_WINDOW_MS + 1))
        expect(screen.queryByRole('button', { name: /^Confirm:/ })).not.toBeInTheDocument()
        expect(calls).toEqual([])
      } finally {
        vi.useRealTimers()
      }
    })

    it('sends on one tap for a tile that is not in the confirm list', () => {
      const { calls } = setup()
      tap(/Lamp/)
      expect(calls).toMatchObject([{ domain: 'switch', service: 'turn_on' }])
    })
  })
})
