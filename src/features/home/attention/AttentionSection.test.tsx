import type { HassEntity } from 'home-assistant-js-websocket'
import { act, screen, within } from '@testing-library/react'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { binarySensorState } from '../../../domains/binary_sensor/factories'
import { batterySensorState, sensorState } from '../../../domains/sensor/factories'
import { updateState } from '../../../domains/update/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { AttentionSection } from './AttentionSection'
import { calmHouse } from './factories'

const NOW = new Date('2026-10-03T12:00:00Z')
const DOOR = 'binary_sensor.garage_door'
const seconds = (d: Date) => d.getTime() / 1000

// Every configured entity present and calm, except what a test overrides.
function seed(door: HassEntity, ...extra: HassEntity[]) {
  const entities = [...calmHouse(), door, ...extra]
  entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e])))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => {
  entityStore.reset()
  vi.useRealTimers()
})

describe('attention section', () => {
  it('shows a left-on item when the clock passes the threshold without a reload', () => {
    // Opened 9 minutes ago: under the 10 minute threshold.
    seed(binarySensorState({ entity_id: DOOR, state: 'on', last_changed: seconds(NOW) - 9 * 60 }))
    render(<AttentionSection />)
    expect(screen.queryByText('Garage door')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText('Garage door')).toBeInTheDocument()
    expect(screen.getByText('Open for 10 min')).toBeInTheDocument()
  })

  it("renders the item's action as disabled with an explanation", () => {
    seed(binarySensorState({ entity_id: DOOR, state: 'on', last_changed: seconds(NOW) - 12 * 60 }))
    render(<AttentionSection />)
    const button = screen.getByRole('button', { name: 'Close garage door' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Available when controls are enabled')
  })

  it('shows that nothing needs attention when no rule is active', () => {
    seed(binarySensorState({ entity_id: DOOR, state: 'off' }))
    render(<AttentionSection />)
    expect(screen.getByRole('region', { name: 'Needs attention' })).toBeInTheDocument()
    expect(screen.getByText('Nothing needs attention')).toBeInTheDocument()
  })

  it('renders chores in a compact row after urgent items', () => {
    seed(
      binarySensorState({ entity_id: DOOR, state: 'on', last_changed: seconds(NOW) - 12 * 60 }),
      batterySensorState({
        entity_id: 'sensor.door_battery',
        state: '12',
        attributes: { friendly_name: 'Front door battery' },
      }),
      updateState({
        entity_id: 'update.router_firmware',
        state: 'on',
        attributes: { installed_version: '4.3.5', latest_version: '4.3.10' },
      }),
    )
    render(<AttentionSection />)
    const chores = screen.getByRole('list', { name: 'Chores' })
    expect(within(chores).getByText('Front door battery')).toBeInTheDocument()
    expect(within(chores).getByText('12%')).toBeInTheDocument()
    expect(within(chores).getByText('4.3.5 → 4.3.10')).toBeInTheDocument()
    const urgent = screen.getByText('Garage door')
    expect(urgent.compareDocumentPosition(chores) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(chores).queryByText('Garage door')).not.toBeInTheDocument()
  })

  it('renders toner reorder as an external link and Mark replaced as a disabled button', () => {
    seed(
      binarySensorState({ entity_id: DOOR, state: 'off' }),
      sensorState({ entity_id: 'sensor.printer_ink', state: '9' }),
      sensorState({ entity_id: 'sensor.furnace_filter_days_remaining', state: '-4' }),
    )
    render(<AttentionSection />)
    const link = screen.getByRole('link', { name: 'Reorder toner' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('Overdue by 4 days')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Mark replaced' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Available when controls are enabled')
  })
})
