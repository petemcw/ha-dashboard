import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lightState } from '../../../domains/light/factories'
import { fanState } from '../../../domains/fan/factories'
import { sceneState } from '../../../domains/scene/factories'
import { scriptState } from '../../../domains/script/factories'
import { switchState } from '../../../domains/switch/factories'
import { entityState } from '../../../domains/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { ServiceCallError } from '../../../infrastructure/serviceGateway/serviceGateway'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { renderWithHome } from '../../../test/renderWithHome'

// The HA connection is the edge: subscribe_user_data pushes `{value}` like HA does.
let push: (ev: { value: unknown }) => void
vi.mock('../../../infrastructure/ha/connection', () => ({
  getConnection: () =>
    Promise.resolve({
      subscribeMessage: (cb: typeof push) => {
        push = cb
        return Promise.resolve(() => Promise.resolve())
      },
    }),
}))

import { FavoritesSection } from './FavoritesSection'

const saved = (...entityIds: string[]) => ({ version: 1, entityIds })
const arrive = (value: unknown) => act(async () => push({ value }))
const seed = (...entities: ReturnType<typeof entityState>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

beforeEach(() => seed())
afterEach(() => {
  entityStore.reset()
  resetConnectionStatus()
})

async function renderLoaded(
  value: unknown,
  onOpenSettings = () => {},
  gateway = createFakeServiceGateway().gateway,
) {
  renderWithHome(<FavoritesSection onOpenSettings={onOpenSettings} />, { gateway })
  await screen.findByRole('region', { name: 'Favorites' })
  await act(async () => {})
  await arrive(value)
}

describe('favorites section', () => {
  it('shows an Add favorites prompt when the user has no saved favorites', async () => {
    const open = vi.fn()
    await renderLoaded(null, open)
    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add favorites' }))
    expect(open).toHaveBeenCalledOnce()
  })

  it("does not show the Add favorites prompt before the user's data has loaded", async () => {
    render(<FavoritesSection />)
    await act(async () => {})
    expect(screen.queryByText('No favorites yet')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add favorites' })).not.toBeInTheDocument()
  })

  it("shows the user's saved favorites in their saved order", async () => {
    seed(
      switchState({ entity_id: 'switch.a', attributes: { friendly_name: 'Alpha' } }),
      lightState({ entity_id: 'light.b', attributes: { friendly_name: 'Bravo' } }),
    )
    await renderLoaded(saved('light.b', 'switch.a'))
    const names = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(names).toEqual(['BravoOff', 'AlphaOff'])
  })

  it('shows a light that is on with its brightness as a percentage', async () => {
    seed(
      lightState({
        entity_id: 'light.k',
        state: 'on',
        attributes: { friendly_name: 'Kitchen', brightness: 128 },
      }),
    )
    await renderLoaded(saved('light.k'))
    expect(screen.getByText('On, 50%')).toBeInTheDocument()
  })

  it('shows a switch as on or off', async () => {
    seed(
      switchState({ entity_id: 'switch.a', state: 'on', attributes: { friendly_name: 'Alpha' } }),
      switchState({ entity_id: 'switch.b', state: 'off', attributes: { friendly_name: 'Beta' } }),
    )
    await renderLoaded(saved('switch.a', 'switch.b'))
    const [a, b] = screen.getAllByRole('listitem')
    expect(a).toHaveTextContent('AlphaOn')
    expect(b).toHaveTextContent('BetaOff')
  })

  it('shows a saved favorite that no longer exists in Home Assistant as missing', async () => {
    await renderLoaded(saved('light.gone'))
    expect(screen.getByRole('listitem')).toHaveTextContent('light.goneMissing')
  })

  it('shows unavailable and unknown states instead of a made-up value', async () => {
    seed(
      lightState({ entity_id: 'light.u', state: 'unavailable' }),
      entityState({ entity_id: 'fan.f', state: 'unknown' }),
    )
    await renderLoaded(saved('light.u', 'fan.f'))
    const [u, f] = screen.getAllByRole('listitem')
    expect(u).toHaveTextContent('Unavailable')
    expect(f).toHaveTextContent('Unknown')
  })

  it("shows other domains' state text", async () => {
    seed(
      entityState({
        entity_id: 'lock.door',
        state: 'locked',
        attributes: { friendly_name: 'Door' },
      }),
    )
    await renderLoaded(saved('lock.door'))
    expect(screen.getByRole('listitem')).toHaveTextContent('Doorlocked')
  })

  it('shows favorites saved on another device without a reload', async () => {
    seed(switchState({ entity_id: 'switch.a', attributes: { friendly_name: 'Alpha' } }))
    await renderLoaded(null)
    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
    await arrive(saved('switch.a'))
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('No favorites yet')).not.toBeInTheDocument()
  })

  it('treats a stored value with an unknown version as no favorites', async () => {
    seed(switchState({ entity_id: 'switch.a' }))
    await renderLoaded({ version: 2, entityIds: ['switch.a'] })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
  })
})

describe('favorite tile controls', () => {
  const kitchen = (state = 'off', attributes = {}) =>
    lightState({
      entity_id: 'light.k',
      state,
      attributes: { friendly_name: 'Kitchen', brightness: 128, ...attributes },
    })

  async function renderTile(entity: ReturnType<typeof entityState>) {
    const fake = createFakeServiceGateway()
    seed(entity)
    setConnected()
    await renderLoaded(saved(entity.entity_id), undefined, fake.gateway)
    return fake
  }

  it('sends light.turn_on when an off light tile is tapped', async () => {
    const fake = await renderTile(kitchen('off'))
    await userEvent.click(screen.getByRole('button', { name: 'Kitchen' }))
    expect(fake.calls).toEqual([
      { domain: 'light', service: 'turn_on', data: undefined, target: { entity_id: 'light.k' } },
    ])
  })

  it('sends switch.turn_off when an on switch tile is tapped', async () => {
    const fake = await renderTile(
      switchState({ entity_id: 'switch.a', state: 'on', attributes: { friendly_name: 'Alpha' } }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Alpha' }))
    expect(fake.calls).toEqual([
      { domain: 'switch', service: 'turn_off', data: undefined, target: { entity_id: 'switch.a' } },
    ])
  })

  it('sends fan.turn_on when an off fan tile is tapped', async () => {
    const fake = await renderTile(
      fanState({ entity_id: 'fan.a', state: 'off', attributes: { friendly_name: 'Desk' } }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Desk' }))
    expect(fake.calls).toEqual([
      { domain: 'fan', service: 'turn_on', data: undefined, target: { entity_id: 'fan.a' } },
    ])
  })

  it('sends script.turn_on with the script as the target when a script tile is tapped', async () => {
    const fake = await renderTile(
      scriptState({ entity_id: 'script.a', attributes: { friendly_name: 'Goodnight' } }),
    )
    const button = screen.getByRole('button', { name: 'Goodnight' })
    expect(button).not.toHaveAttribute('aria-pressed')
    await userEvent.click(button)
    expect(fake.calls).toEqual([
      {
        domain: 'script',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: 'script.a' },
      },
    ])
  })

  it('sends scene.turn_on when a scene favorite tile is tapped', async () => {
    const fake = await renderTile(
      sceneState({ entity_id: 'scene.a', attributes: { friendly_name: 'Movie night' } }),
    )
    const button = screen.getByRole('button', { name: 'Movie night' })
    expect(button).not.toHaveAttribute('aria-pressed')
    await userEvent.click(button)
    expect(fake.calls).toEqual([
      { domain: 'scene', service: 'turn_on', data: undefined, target: { entity_id: 'scene.a' } },
    ])
  })

  it('shows "Running" on a script tile while HA reports the script as on', async () => {
    await renderTile(
      scriptState({
        entity_id: 'script.a',
        state: 'on',
        attributes: { friendly_name: 'Goodnight' },
      }),
    )
    expect(screen.getByRole('button', { name: 'Goodnight' })).toHaveAccessibleDescription('Running')
  })

  it('disables a script tile while HA reports the script as running', async () => {
    await renderTile(
      scriptState({
        entity_id: 'script.a',
        state: 'on',
        attributes: { friendly_name: 'Goodnight' },
      }),
    )
    expect(screen.getByRole('button', { name: 'Goodnight' })).toBeDisabled()
  })

  it('shows "Didn\'t work, tap to retry" on a script tile when the run fails', async () => {
    const fake = await renderTile(
      scriptState({ entity_id: 'script.a', attributes: { friendly_name: 'Goodnight' } }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Goodnight' }))
    await act(async () => fake.reject(new ServiceCallError('rejected')))
    expect(screen.getByRole('status')).toHaveTextContent("Didn't work, tap to retry")
    expect(screen.getByRole('button', { name: 'Goodnight' })).toBeEnabled()
  })

  it('disables a fan or script tile for an unavailable or missing entity', async () => {
    seed(
      fanState({ entity_id: 'fan.u', state: 'unavailable' }),
      scriptState({ entity_id: 'script.u', state: 'unavailable' }),
    )
    setConnected()
    await renderLoaded(saved('fan.u', 'fan.gone', 'script.u', 'script.gone'))
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    for (const b of buttons) expect(b).toBeDisabled()
  })

  it('marks an on tile as pressed for assistive technology', async () => {
    await renderTile(kitchen('on'))
    expect(screen.getByRole('button', { name: 'Kitchen' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks an off tile as not pressed', async () => {
    await renderTile(kitchen('off'))
    expect(screen.getByRole('button', { name: 'Kitchen' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables the tile while the action is pending', async () => {
    const fake = await renderTile(kitchen('off'))
    await userEvent.click(screen.getByRole('button', { name: 'Kitchen' }))
    const button = screen.getByRole('button', { name: 'Kitchen' })
    // aria-disabled rather than disabled, so keyboard focus stays on the tile.
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(button)
    expect(fake.calls).toHaveLength(1)
    await act(async () => fake.resolve())
    expect(button).not.toHaveAttribute('aria-disabled')
  })

  it('shows "Didn\'t work, tap to retry" when the action fails', async () => {
    const fake = await renderTile(kitchen('off'))
    await userEvent.click(screen.getByRole('button', { name: 'Kitchen' }))
    await act(async () => fake.reject(new ServiceCallError('rejected')))
    expect(screen.getByRole('status')).toHaveTextContent("Didn't work, tap to retry")
    expect(screen.getByRole('button', { name: 'Kitchen' })).toBeEnabled()
  })

  it('disables controls while the connection is not connected', async () => {
    seed(kitchen('off'))
    await renderLoaded(saved('light.k'))
    resetConnectionStatus()
    await act(async () => {})
    expect(screen.getByRole('button', { name: 'Kitchen' })).toBeDisabled()
  })

  it('disables the tile for an unavailable or missing entity', async () => {
    seed(lightState({ entity_id: 'light.u', state: 'unavailable' }))
    setConnected()
    await renderLoaded(saved('light.u', 'light.gone'))
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    for (const b of buttons) expect(b).toBeDisabled()
  })

  it("names a tile's button by the entity's name and describes it with its state", async () => {
    await renderTile(kitchen('on'))
    const button = screen.getByRole('button', { name: 'Kitchen' })
    expect(button).toHaveAccessibleDescription('On, 50%')
  })

  it('shows "Connection dropped, check before retrying" when the connection drops mid-call', async () => {
    const fake = await renderTile(kitchen('off'))
    await userEvent.click(screen.getByRole('button', { name: 'Kitchen' }))
    await act(async () => fake.reject(new ServiceCallError('connection-lost')))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Connection dropped, check before retrying',
    )
  })

  it('clears the error when HA reports the entity changed', async () => {
    const fake = await renderTile(kitchen('off'))
    await userEvent.click(screen.getByRole('button', { name: 'Kitchen' }))
    await act(async () => fake.reject(new ServiceCallError('rejected')))
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement()
    seed(kitchen('on'))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('keeps display-only tiles non-interactive', async () => {
    seed(entityState({ entity_id: 'lock.door', state: 'locked' }))
    setConnected()
    await renderLoaded(saved('lock.door'))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('favorite tile icons', () => {
  const iconOf = (name: string) =>
    screen.getByRole('button', { name }).querySelector('svg.favorite-icon')

  it('shows a lightbulb icon on a light tile', async () => {
    seed(lightState({ entity_id: 'light.k', attributes: { friendly_name: 'Kitchen' } }))
    await renderLoaded(saved('light.k'))
    const icon = iconOf('Kitchen')
    expect(icon).toHaveClass('lucide-lightbulb')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the matching icon for switch, fan, scene, and script tiles', async () => {
    seed(
      switchState({ entity_id: 'switch.s', attributes: { friendly_name: 'Sw' } }),
      fanState({ entity_id: 'fan.f', attributes: { friendly_name: 'Fa' } }),
      sceneState({ entity_id: 'scene.c', attributes: { friendly_name: 'Sc' } }),
      scriptState({ entity_id: 'script.p', attributes: { friendly_name: 'Sp' } }),
    )
    await renderLoaded(saved('switch.s', 'fan.f', 'scene.c', 'script.p'))
    expect(iconOf('Sw')).toHaveClass('lucide-plug')
    expect(iconOf('Fa')).toHaveClass('lucide-fan')
    expect(iconOf('Sc')).toHaveClass('lucide-sparkles')
    expect(iconOf('Sp')).toHaveClass('lucide-play')
  })

  it('shows a fallback icon on a display-only tile', async () => {
    seed(entityState({ entity_id: 'sensor.x', state: '5', attributes: { friendly_name: 'Odd' } }))
    await renderLoaded(saved('sensor.x'))
    const tile = screen.getByText('Odd').closest('li')!
    expect(tile.querySelector('svg.favorite-icon')).toHaveClass('lucide-circle-dot')
  })

  it('highlights the icon of a tile whose entity is on', async () => {
    seed(
      lightState({ entity_id: 'light.on', state: 'on', attributes: { friendly_name: 'Lit' } }),
      lightState({ entity_id: 'light.off', attributes: { friendly_name: 'Dark' } }),
    )
    await renderLoaded(saved('light.on', 'light.off'))
    expect(iconOf('Lit')?.closest('.favorite-tile')).toHaveAttribute('data-active')
    expect(iconOf('Dark')?.closest('.favorite-tile')).not.toHaveAttribute('data-active')
  })
})
