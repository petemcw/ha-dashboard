import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sensorState } from '../../../domains/sensor/factories'
import { scriptState } from '../../../domains/script/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { ServiceCallError } from '../../../infrastructure/serviceGateway/serviceGateway'
import { AttentionHarness } from '../../../test/AttentionHarness'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { CONFIRM_GUARD_MS } from '../../shared/ConfirmButton'
import { calmHouse } from './factories'

const FURNACE_DAYS = 'sensor.furnace_filter_days_remaining'
const FURNACE_RESET = 'script.reset_furnace_filter'

function seed(...overrides: ReturnType<typeof scriptState>[]) {
  const entities = [
    ...calmHouse(),
    sensorState({ entity_id: FURNACE_DAYS, state: '-4' }),
    scriptState({ entity_id: FURNACE_RESET }),
    ...overrides,
  ]
  const byId = Object.fromEntries(entities.map((e) => [e.entity_id, e]))
  entityStore.setEntities(byId)
}

const flush = () => act(async () => {})
const arm = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Mark replaced' }))
  act(() => vi.advanceTimersByTime(CONFIRM_GUARD_MS))
}

let fake: ReturnType<typeof createFakeServiceGateway>
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-03T12:00:00Z'))
  setConnected()
  fake = createFakeServiceGateway()
})
afterEach(() => {
  entityStore.reset()
  resetConnectionStatus()
  vi.useRealTimers()
})

const show = () => render(<AttentionHarness />, { gateway: fake.gateway })

describe('filter chore actions', () => {
  it('does not run the reset script on the first tap of Mark replaced', () => {
    seed()
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Mark replaced' }))
    expect(fake.calls).toEqual([])
    expect(screen.getByRole('button', { name: 'Tap again to confirm' })).toBeInTheDocument()
  })

  it("sends script.turn_on for the filter's reset script on the confirming tap", () => {
    seed()
    show()
    arm()
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to confirm' }))
    expect(fake.calls).toEqual([
      {
        domain: 'script',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: FURNACE_RESET },
      },
    ])
  })

  it('shows "Didn\'t work, tap to retry" on the chore when the script fails', async () => {
    seed()
    show()
    arm()
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to confirm' }))
    fake.reject(new ServiceCallError('rejected'))
    await flush()
    expect(screen.getByText("Didn't work, tap to retry")).toBeInTheDocument()
    arm()
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to confirm' }))
    expect(fake.calls).toHaveLength(2)
  })

  it('disables Mark replaced when the reset script is missing or unavailable', () => {
    seed(scriptState({ entity_id: FURNACE_RESET, state: 'unavailable' }))
    const { unmount } = show()
    expect(screen.getByRole('button', { name: 'Mark replaced' })).toBeDisabled()
    unmount()

    const entities = { ...entityStore.get().entities }
    delete entities[FURNACE_RESET]
    entityStore.setEntities(entities)
    show()
    expect(screen.getByRole('button', { name: 'Mark replaced' })).toBeDisabled()
  })
})
