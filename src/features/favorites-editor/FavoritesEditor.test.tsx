import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lightState } from '../../domains/light/factories'
import { switchState } from '../../domains/switch/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'

// The HA connection is the edge: user data is pushed like HA does, sets are recorded.
let push: (ev: { value: unknown }) => void
const sent = vi.fn<(msg: { type: string; key: string; value: unknown }) => Promise<unknown>>()
vi.mock('../../infrastructure/ha/connection', () => ({
  getConnection: () =>
    Promise.resolve({
      subscribeMessage: (cb: typeof push) => {
        push = cb
        return Promise.resolve(() => Promise.resolve())
      },
      sendMessagePromise: (msg: Parameters<typeof sent>[0]) => sent(msg),
    }),
}))

import { FavoritesEditor } from './FavoritesEditor'

const saved = (...entityIds: string[]) => ({ version: 1, entityIds })
const arrive = (value: unknown) => act(async () => push({ value }))
const lastSaved = () => sent.mock.calls.at(-1)![0].value

const kitchen = lightState({
  entity_id: 'light.kitchen',
  attributes: { friendly_name: 'Kitchen' },
})
const fan = switchState({ entity_id: 'switch.fan', attributes: { friendly_name: 'Desk fan' } })

beforeEach(() => {
  sent.mockReset()
  sent.mockResolvedValue(null)
  act(() => entityStore.setEntities({ [kitchen.entity_id]: kitchen, [fan.entity_id]: fan }))
})
afterEach(() => entityStore.reset())

async function renderLoaded(value: unknown) {
  render(<FavoritesEditor />)
  await act(async () => {})
  await arrive(value)
}

describe('favorites editor', () => {
  it("saves an added favorite to the user's data", async () => {
    await renderLoaded(saved('switch.fan'))
    await userEvent.type(screen.getByRole('searchbox'), 'kitch')
    expect(screen.getByRole('button', { name: 'Add Kitchen' })).toHaveTextContent('light.kitchen')
    await userEvent.click(screen.getByRole('button', { name: 'Add Kitchen' }))
    expect(sent).toHaveBeenCalledWith({
      type: 'frontend/set_user_data',
      key: 'ha-dashboard:favorites',
      value: saved('switch.fan', 'light.kitchen'),
    })
  })

  it('moves a favorite up in the saved order', async () => {
    await renderLoaded(saved('switch.fan', 'light.kitchen'))
    await userEvent.click(screen.getByRole('button', { name: 'Move up Kitchen' }))
    expect(lastSaved()).toEqual(saved('light.kitchen', 'switch.fan'))
  })

  it('removes a favorite, including one missing from Home Assistant', async () => {
    await renderLoaded(saved('light.gone', 'switch.fan'))
    await userEvent.click(screen.getByRole('button', { name: 'Remove light.gone' }))
    expect(lastSaved()).toEqual(saved('switch.fan'))
  })

  it('keeps the previous list and shows an error when saving fails', async () => {
    sent.mockRejectedValue(new Error('nope'))
    await renderLoaded(saved('switch.fan'))
    await userEvent.click(screen.getByRole('button', { name: 'Remove Desk fan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save favorites")
    expect(screen.getByText('Desk fan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Desk fan' })).toBeEnabled()
  })

  it("does not allow edits until the user's favorites have loaded", async () => {
    render(<FavoritesEditor />)
    await act(async () => {})
    await userEvent.type(screen.getByRole('searchbox'), 'kitch')
    expect(screen.getByRole('button', { name: 'Add Kitchen' })).toBeDisabled()
    await arrive(null)
    expect(screen.getByRole('button', { name: 'Add Kitchen' })).toBeEnabled()
  })

  it('disables editing while a save is in progress', async () => {
    let finish!: () => void
    sent.mockReturnValue(new Promise((r) => (finish = () => r(null))))
    await renderLoaded(saved('switch.fan', 'light.kitchen'))
    await userEvent.click(screen.getByRole('button', { name: 'Remove Desk fan' }))
    expect(screen.getByRole('button', { name: 'Remove Kitchen' })).toBeDisabled()
    await act(async () => {
      push({ value: saved('light.kitchen') })
      finish()
    })
    // The next edit starts from the value that was just saved.
    await userEvent.click(screen.getByRole('button', { name: 'Remove Kitchen' }))
    expect(lastSaved()).toEqual(saved())
  })

  it('does not overwrite a stored value with an unknown version', async () => {
    await renderLoaded({ version: 2, entityIds: ['light.kitchen'] })
    expect(screen.getByText(/newer version/)).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
