import type { HassEntity } from 'home-assistant-js-websocket'
import type { Connection } from 'home-assistant-js-websocket'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { binarySensorState } from '../../../domains/binary_sensor/factories'
import { sensorState } from '../../../domains/sensor/factories'
import { switchState } from '../../../domains/switch/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { connectionStatus } from '../../../infrastructure/ha/connectionStatus'
import { ServiceCallError } from '../../../infrastructure/serviceGateway/serviceGateway'
import { AttentionHarness } from '../../../test/AttentionHarness'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { calmHouse } from './factories'

const NOW = new Date('2026-10-03T12:00:00Z')
const longAgo = NOW.getTime() / 1000 - 120 * 60
const HEATER = 'switch.space_heater'

function seed(...overrides: HassEntity[]) {
  const entities = [
    ...calmHouse(),
    switchState({ entity_id: 'switch.garage_door_opener', state: 'off' }),
    ...overrides,
  ]
  entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e])))
}
const heaterOn = () => switchState({ entity_id: HEATER, state: 'on', last_changed: longAgo })
const doorOpen = () =>
  binarySensorState({ entity_id: 'binary_sensor.garage_door', state: 'on', last_changed: longAgo })

// A connection that lets this user snooze (admin, nothing stored yet).
const snoozableConnection = () =>
  Promise.resolve({
    subscribeMessage: (cb: (ev: { value: unknown }) => void) => {
      cb({ value: null })
      return Promise.resolve(() => Promise.resolve())
    },
    sendMessagePromise: () => Promise.resolve({ id: 'u', is_admin: true }),
  } as unknown as Connection)

const settle = () => act(() => vi.advanceTimersByTimeAsync(10))
const row = (title: string) => screen.getByText(title).closest('li')!

let fake: ReturnType<typeof createFakeServiceGateway>
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false })
  vi.setSystemTime(NOW)
  connectionStatus.set({ kind: 'connected' })
  fake = createFakeServiceGateway()
})
afterEach(() => {
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
  vi.useRealTimers()
})

describe('attention rows', () => {
  it("shows an item's icon badge, title, and detail in one row with its actions on the right", () => {
    seed(doorOpen())
    render(<AttentionHarness />, { gateway: fake.gateway })
    const garage = row('Garage door')
    expect(garage.querySelector('svg.lucide-warehouse')).toHaveAttribute('aria-hidden', 'true')
    expect(within(garage).getByText('Garage door')).toBeInTheDocument()
    expect(within(garage).getByText(/^Open for 2 h/)).toBeInTheDocument()
    expect(within(garage).getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
  })

  it("shows an item's action as an icon button that keeps the action's name", () => {
    seed(heaterOn())
    render(<AttentionHarness />, { gateway: fake.gateway })
    const turnOff = screen.getByRole('button', { name: 'Turn off' })
    expect(turnOff.querySelector('svg.lucide-power')).not.toBeNull()
    expect(turnOff).toHaveTextContent('')
    fireEvent.click(turnOff)
    expect(screen.getByRole('button', { name: 'Turning off…' })).toBeInTheDocument()
  })

  it('shows the toner reorder link as an icon link named Reorder toner', () => {
    seed(sensorState({ entity_id: testHomeConfig.tonerRule.entity_id, state: '5' }))
    render(<AttentionHarness />, { gateway: fake.gateway })
    const link = screen.getByRole('link', { name: 'Reorder toner' })
    expect(link).toHaveAttribute('href', testHomeConfig.tonerRule.reorderUrl)
    expect(link.querySelector('svg.lucide-shopping-cart')).not.toBeNull()
    expect(link).toHaveTextContent('')
  })

  it('shows snooze as a clock icon button that opens the one day and one week choices', async () => {
    seed(heaterOn())
    render(<AttentionHarness connect={snoozableConnection} />, { gateway: fake.gateway })
    await settle()
    const snooze = screen.getByRole('button', { name: 'Snooze Space heater' })
    expect(snooze.querySelector('svg.lucide-alarm-clock')).not.toBeNull()
    fireEvent.click(snooze)
    const group = screen.getByRole('group', { name: 'Snooze Space heater' })
    expect(within(group).getByRole('button', { name: '1 day' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: '1 week' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it("shows an action's failure on its own line under the row without moving the action buttons", async () => {
    seed(heaterOn())
    render(<AttentionHarness connect={snoozableConnection} />, { gateway: fake.gateway })
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    fake.reject(new ServiceCallError('rejected'))
    await settle()
    const failure = screen.getByText("Didn't work, tap to retry")
    const heater = row('Space heater')
    // A direct child of the row, not of the actions beside the text.
    expect(failure.parentElement).toBe(heater)
    const actions = screen.getByRole('button', { name: 'Turn off' }).parentElement!
    expect(actions).not.toContainElement(failure)
    expect(actions).toContainElement(screen.getByRole('button', { name: 'Snooze Space heater' }))
  })

  it('keeps the failure live region in the row while there is no failure', () => {
    seed(heaterOn())
    render(<AttentionHarness />, { gateway: fake.gateway })
    const status = within(row('Space heater')).getByRole('status')
    expect(status).toBeEmptyDOMElement()
  })
})
