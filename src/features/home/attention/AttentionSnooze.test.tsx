import { act, fireEvent, screen, within } from '@testing-library/react'
import { renderWithHome as render } from '../../../test/renderWithHome'
import type { Connection } from 'home-assistant-js-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { batterySensorState } from '../../../domains/sensor/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { connectionStatus } from '../../../infrastructure/ha/connectionStatus'
import { AttentionSection } from './AttentionSection'
import { calmHouse } from './factories'
import { CLEANUP_DEBOUNCE_MS } from './useSnoozes'

const NOW = new Date('2026-10-03T12:00:00Z')
const BATTERY = 'sensor.door_battery'
const ID = `battery-low:${BATTERY}`
const FUTURE = '2026-10-05T09:00:00Z'
const PAST = '2026-10-01T09:00:00Z'
const stored = (snoozes: Record<string, { until: string; by: string }>) => ({
  version: 1,
  snoozes,
})

// A fake Connection at the library boundary: system data subscription, current user, writes.
function fakeHa(user: { id: string; is_admin: boolean }, initial: unknown = null) {
  let push: (ev: { value: unknown }) => void = () => {}
  const writes: { key: string; value: unknown }[] = []
  let failWrites = false
  const conn = {
    subscribeMessage: (cb: typeof push) => {
      push = cb
      cb({ value: initial })
      return Promise.resolve(() => Promise.resolve())
    },
    sendMessagePromise: (msg: { type: string; key?: string; value?: unknown }) => {
      if (msg.type === 'auth/current_user') return Promise.resolve(user)
      if (msg.type === 'frontend/set_system_data') {
        if (failWrites) return Promise.reject({ code: 'unauthorized' })
        writes.push({ key: msg.key!, value: msg.value })
        return Promise.resolve()
      }
      return Promise.reject(new Error(`unexpected ${msg.type}`))
    },
  } as unknown as Connection
  return {
    connect: () => Promise.resolve(conn),
    writes,
    emit: (value: unknown) => push({ value }),
    failWrites: () => (failWrites = true),
  }
}

const admin = { id: 'admin-1', is_admin: true }

function seed(battery: string) {
  const entities = [
    ...calmHouse(),
    batterySensorState({
      entity_id: BATTERY,
      state: battery,
      attributes: { friendly_name: 'Front door battery' },
    }),
  ]
  entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e])))
}

// Lets promise chains (connect, subscribe, current user) settle under fake timers.
const settle = () => act(() => vi.advanceTimersByTimeAsync(10))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false })
  vi.setSystemTime(NOW)
  connectionStatus.set({ kind: 'connected' })
})
afterEach(() => {
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
  vi.useRealTimers()
})

// The chore row only: the snoozed list also names the item.
const chore = () => {
  const row = screen.queryByRole('list', { name: 'Chores' })
  return row && within(row).queryByText('Front door battery')
}

describe('attention snoozes', () => {
  it('hides an item snoozed until a time in the future and lists it as snoozed', async () => {
    const ha = fakeHa(admin, stored({ [ID]: { until: FUTURE, by: 'admin-1' } }))
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    expect(chore()).toBeFalsy()
    const disclosure = screen.getByText('1 snoozed')
    expect(within(disclosure.closest('details')!).getByText('Front door battery')).toBeTruthy()
    expect(screen.getByText(/^until /)).toBeInTheDocument()
  })

  it('shows an item again once its snooze has expired', async () => {
    const ha = fakeHa(admin, stored({ [ID]: { until: '2026-10-03T12:00:40Z', by: 'u' } }))
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    expect(chore()).toBeFalsy()
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(chore()).toBeTruthy()
  })

  it('stores a one-week snooze in shared system data when an admin chooses 1 week', async () => {
    const ha = fakeHa(admin)
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Snooze Front door battery' }))
    fireEvent.click(screen.getByRole('button', { name: '1 week' }))
    await settle()
    expect(ha.writes).toEqual([
      {
        key: 'ha-dashboard:snoozes',
        value: stored({
          [ID]: {
            // settle() moved the fake clock 10 ms before the tap.
            until: '2026-10-10T12:00:00.010Z',
            by: 'admin-1',
          },
        }),
      },
    ])
  })

  it('shows a failed write as a non-blocking error and leaves the item visible', async () => {
    const ha = fakeHa(admin)
    ha.failWrites()
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Snooze Front door battery' }))
    fireEvent.click(screen.getByRole('button', { name: '1 day' }))
    await settle()
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save the snooze")
    expect(chore()).toBeTruthy()
  })

  it('lets an admin unsnooze from the snoozed list', async () => {
    const ha = fakeHa(admin, stored({ [ID]: { until: FUTURE, by: 'admin-1' } }))
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    fireEvent.click(screen.getByText('1 snoozed'))
    fireEvent.click(screen.getByRole('button', { name: 'Unsnooze Front door battery' }))
    await settle()
    expect(ha.writes[0].value).toEqual(stored({}))
  })

  it('does not offer a snooze action until the stored snoozes have loaded', async () => {
    // A connection whose subscription never delivers its first value.
    const ha = fakeHa(admin)
    const conn = await ha.connect()
    ;(conn as unknown as { subscribeMessage: unknown }).subscribeMessage = () =>
      Promise.resolve(() => Promise.resolve())
    seed('12')
    render(<AttentionSection connect={() => Promise.resolve(conn)} />)
    await settle()
    expect(chore()).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Snooze/ })).not.toBeInTheDocument()
  })

  it('does not offer a snooze action to a non-admin user, but still shows what is snoozed', async () => {
    const ha = fakeHa(
      { id: 'kiosk', is_admin: false },
      stored({ [ID]: { until: FUTURE, by: 'admin-1' } }),
    )
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    expect(screen.getByText('1 snoozed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /snooze/i })).not.toBeInTheDocument()
  })

  it('shows a snooze made on another device without a reload', async () => {
    const ha = fakeHa({ id: 'kiosk', is_admin: false })
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    expect(chore()).toBeTruthy()
    act(() => ha.emit(stored({ [ID]: { until: FUTURE, by: 'admin-1' } })))
    expect(chore()).toBeFalsy()
  })

  it('ignores a stored value with an unknown version and never overwrites it', async () => {
    const ha = fakeHa(admin, { version: 9, snoozes: { [ID]: { until: FUTURE, by: 'x' } } })
    seed('12')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    expect(chore()).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Snooze/ })).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS * 2))
    expect(ha.writes).toEqual([])
  })
})

describe('snooze cleanup', () => {
  it('removes a stored snooze when its item has resolved', async () => {
    const ha = fakeHa(
      admin,
      stored({
        [ID]: { until: FUTURE, by: 'admin-1' },
        'other-item': { until: FUTURE, by: 'admin-1' },
      }),
    )
    seed('85') // battery recovered: present, available, above the threshold
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS + 100))
    expect(ha.writes).toEqual([
      { key: 'ha-dashboard:snoozes', value: stored({ 'other-item': expect.anything() }) },
    ])
  })

  it('keeps a snooze while its entity is unavailable', async () => {
    const ha = fakeHa(admin, stored({ [ID]: { until: FUTURE, by: 'admin-1' } }))
    seed('unavailable')
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS * 3))
    expect(ha.writes).toEqual([])
  })

  it('does not remove snoozes before the first entity snapshot arrives', async () => {
    const ha = fakeHa(admin, stored({ [ID]: { until: PAST, by: 'admin-1' } }))
    render(<AttentionSection connect={ha.connect} />)
    await settle()
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS * 2))
    expect(ha.writes).toEqual([])

    act(() => seed('12'))
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS + 100))
    expect(ha.writes).toHaveLength(1) // the expired one goes once everything has loaded
  })

  it('does not clean up while disconnected, and never as a non-admin', async () => {
    const value = stored({ [ID]: { until: PAST, by: 'admin-1' } })
    const offline = fakeHa(admin, value)
    connectionStatus.set({ kind: 'reconnecting' })
    seed('85')
    const { unmount } = render(<AttentionSection connect={offline.connect} />)
    await settle()
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS * 2))
    expect(offline.writes).toEqual([])
    unmount()

    connectionStatus.set({ kind: 'connected' })
    const viewer = fakeHa({ id: 'kiosk', is_admin: false }, value)
    render(<AttentionSection connect={viewer.connect} />)
    await settle()
    await act(() => vi.advanceTimersByTimeAsync(CLEANUP_DEBOUNCE_MS * 2))
    expect(viewer.writes).toEqual([])
  })
})
