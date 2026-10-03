import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lightState } from '../../../domains/light/factories'
import { switchState } from '../../../domains/switch/factories'
import { entityState } from '../../../domains/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'

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
afterEach(() => entityStore.reset())

async function renderLoaded(value: unknown, onOpenSettings = () => {}) {
  render(<FavoritesSection onOpenSettings={onOpenSettings} />)
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
