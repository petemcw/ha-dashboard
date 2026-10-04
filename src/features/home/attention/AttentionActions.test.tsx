import type { HassEntity } from 'home-assistant-js-websocket'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { binarySensorState } from '../../../domains/binary_sensor/factories'
import { switchState } from '../../../domains/switch/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { ServiceCallError } from '../../../infrastructure/serviceGateway/serviceGateway'
import { AttentionHarness } from '../../../test/AttentionHarness'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { CONFIRM_GUARD_MS } from '../../shared/ConfirmButton'
import { calmHouse } from './factories'

const NOW = new Date('2026-10-03T12:00:00Z')
const DOOR = 'binary_sensor.garage_door'
const OPENER = 'switch.garage_door_opener'
const HEATER = 'switch.space_heater'
const seconds = (d: Date) => d.getTime() / 1000
const longAgo = seconds(NOW) - 120 * 60

function seed(...overrides: HassEntity[]) {
  const entities = [...calmHouse(), switchState({ entity_id: OPENER, state: 'off' }), ...overrides]
  const byId = Object.fromEntries(entities.map((e) => [e.entity_id, e]))
  entityStore.setEntities(byId)
}
const doorOpen = (state = 'on') =>
  binarySensorState({ entity_id: DOOR, state, last_changed: longAgo })
const heaterOn = (state = 'on') => switchState({ entity_id: HEATER, state, last_changed: longAgo })

const flush = () => act(async () => {})
const arm = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }))
  act(() => vi.advanceTimersByTime(CONFIRM_GUARD_MS))
}

let fake: ReturnType<typeof createFakeServiceGateway>
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  setConnected()
  fake = createFakeServiceGateway()
})
afterEach(() => {
  entityStore.reset()
  resetConnectionStatus()
  vi.useRealTimers()
})

const show = () => render(<AttentionHarness />, { gateway: fake.gateway })

describe('left-on attention actions', () => {
  it('sends switch.turn_off for the space heater when Turn off is tapped', () => {
    seed(heaterOn())
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    expect(fake.calls).toEqual([
      { domain: 'switch', service: 'turn_off', data: undefined, target: { entity_id: HEATER } },
    ])
  })

  it('does not send the garage toggle on the first tap', () => {
    seed(doorOpen())
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Close garage door' }))
    expect(fake.calls).toEqual([])
    expect(screen.getByRole('button', { name: 'Tap to close' })).toBeInTheDocument()
  })

  it('sends switch.toggle for the garage opener on the confirming tap', () => {
    seed(doorOpen())
    show()
    arm('Close garage door')
    fireEvent.click(screen.getByRole('button', { name: 'Tap to close' }))
    expect(fake.calls).toEqual([
      { domain: 'switch', service: 'toggle', data: undefined, target: { entity_id: OPENER } },
    ])
  })

  it('sends nothing when the door sensor no longer reads open at the confirming tap', () => {
    seed(doorOpen())
    show()
    arm('Close garage door')
    const confirm = screen.getByRole('button', { name: 'Tap to close' })
    // The store moves between the last render and the tap.
    seed(doorOpen('off'))
    fireEvent.click(confirm)
    expect(fake.calls).toEqual([])
  })

  it('sends nothing when a turn_off rule entity already reads off at send time', () => {
    seed(heaterOn())
    show()
    const button = screen.getByRole('button', { name: 'Turn off' })
    // Changed in the store after the render the user tapped on.
    entityStore.setEntities({
      ...entityStore.get().entities,
      [HEATER]: heaterOn('off'),
    })
    fireEvent.click(button)
    expect(fake.calls).toEqual([])
  })

  it('sends nothing when the sensor is unavailable at send time', () => {
    seed(heaterOn())
    show()
    const button = screen.getByRole('button', { name: 'Turn off' })
    entityStore.setEntities({
      ...entityStore.get().entities,
      [HEATER]: heaterOn('unavailable'),
    })
    fireEvent.click(button)
    expect(fake.calls).toEqual([])
  })

  it('shows "Didn\'t work, tap to retry" on the item when the action fails', async () => {
    seed(heaterOn())
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    fake.reject(new ServiceCallError('rejected'))
    await flush()
    expect(screen.getByText("Didn't work, tap to retry")).toBeInTheDocument()
  })

  it('keeps the item until HA reports the entity off', async () => {
    seed(heaterOn())
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    fake.resolve()
    await flush()
    expect(screen.getByText('Space heater')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Turn off' })).toBeInTheDocument()

    act(() => seed(heaterOn('off')))
    expect(screen.queryByText('Space heater')).not.toBeInTheDocument()
  })

  it('disables the action when its target entity is missing or unavailable', () => {
    seed(doorOpen(), switchState({ entity_id: OPENER, state: 'unavailable' }))
    const { unmount } = show()
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeDisabled()
    unmount()

    const entities = { ...entityStore.get().entities }
    delete entities[OPENER]
    entityStore.setEntities(entities)
    show()
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeDisabled()
  })

  it('needs two taps again to retry the garage toggle after a failure', async () => {
    seed(doorOpen())
    show()
    arm('Close garage door')
    fireEvent.click(screen.getByRole('button', { name: 'Tap to close' }))
    fake.reject(new ServiceCallError('rejected'))
    await flush()
    expect(screen.getByText("Didn't work, tap to retry")).toBeInTheDocument()

    arm('Close garage door')
    expect(fake.calls).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Tap to close' }))
    expect(fake.calls).toHaveLength(2)
  })
})
