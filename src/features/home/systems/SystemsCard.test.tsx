import { mdiWifi } from '@mdi/js'
import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import type { HomeConfig } from '../../../config/homeConfig'
import { entityState } from '../../../domains/factories'
import { sensorState } from '../../../domains/sensor/factories'
import { updateState } from '../../../domains/update/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { SystemsCard } from './SystemsCard'

// Local time, so "Today" and the clock time don't depend on the machine's zone.
const NOW = new Date(2026, 9, 4, 12, 0, 0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  entityStore.reset()
})

const load = (...entities: ReturnType<typeof entityState>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

const status = (state: string) => sensorState({ entity_id: 'sensor.gateway_state', state })
const ap = (id: string, state: string) => sensorState({ entity_id: `sensor.${id}_ap_state`, state })
const tile = (name: string) => within(screen.getByRole('group', { name }))

describe('systems card', () => {
  it('renders the systems card label with an MDI icon', () => {
    load(status('connected'))
    render(<SystemsCard />)
    const region = screen.getByRole('region', { name: 'Systems' })
    expect(region.querySelector('svg.card__icon path')?.getAttribute('d')).toBe(mdiWifi)
  })

  it('shows Gateway online when the status entity is in its up state', () => {
    load(status('connected'))
    render(<SystemsCard />)
    const card = within(screen.getByRole('region', { name: 'Systems' }))
    expect(card.getByText('Gateway online')).toBeInTheDocument()
  })

  it('shows Gateway offline when the status entity is in any other state', () => {
    load(status('disconnected'))
    render(<SystemsCard />)
    expect(screen.getByText('Gateway offline')).toBeInTheDocument()
  })

  it('shows Gateway unknown when HA cannot tell, and missing when the entity does not exist', () => {
    load(status('unavailable'))
    const { unmount } = render(<SystemsCard />)
    expect(screen.getByText('Gateway unknown')).toBeInTheDocument()
    unmount()
    load()
    render(<SystemsCard />)
    expect(screen.getByText('Gateway missing')).toBeInTheDocument()
  })

  it('tints the status chip ok when online, danger when offline, and neutral otherwise', () => {
    const chipFor = (...entities: ReturnType<typeof status>[]) => {
      load(...entities)
      const { unmount } = render(<SystemsCard />)
      const header = within(screen.getByRole('region', { name: 'Systems' }))
      const chip = header.getByText(/^Gateway /)
      unmount()
      return chip
    }
    expect(chipFor(status('connected'))).toHaveClass('chip--ok')
    expect(chipFor(status('disconnected'))).toHaveClass('chip--danger')
    expect(chipFor(status('unavailable'))).toHaveClass('chip--neutral')
    expect(chipFor()).toHaveClass('chip--neutral')
  })

  it('shows the gateway uptime in days from its boot timestamp', () => {
    // Relative to NOW, so the answer is the same in every time zone.
    const booted = new Date(NOW.getTime() - (19 * 24 + 4) * 3_600_000)
    load(sensorState({ entity_id: 'sensor.gateway_boot_time', state: booted.toISOString() }))
    render(<SystemsCard />)
    expect(screen.getByRole('group', { name: 'Uptime' })).toHaveTextContent('19 d')
    expect(tile('Uptime').getByText('Gateway')).toBeInTheDocument()
  })

  it('shows hours when the gateway has been up less than a day', () => {
    load(sensorState({ entity_id: 'sensor.gateway_boot_time', state: NOW.toISOString() }))
    vi.setSystemTime(new Date(NOW.getTime() + 5 * 3_600_000 + 60_000))
    render(<SystemsCard />)
    expect(screen.getByRole('group', { name: 'Uptime' })).toHaveTextContent('5 h')
  })

  it('treats a future or unparseable boot timestamp as unknown', () => {
    load(sensorState({ entity_id: 'sensor.gateway_boot_time', state: '2099-01-01T00:00:00Z' }))
    const { unmount } = render(<SystemsCard />)
    expect(tile('Uptime').getByText('Unknown')).toBeInTheDocument()
    unmount()
    load(sensorState({ entity_id: 'sensor.gateway_boot_time', state: 'garbage' }))
    render(<SystemsCard />)
    expect(tile('Uptime').getByText('Unknown')).toBeInTheDocument()
  })

  it('shows how many access points are online out of those configured', () => {
    load(
      ap('office', 'connected'),
      ap('hallway', 'disconnected'),
      ap('garage', 'connected'),
      ap('basement', 'connected'),
    )
    render(<SystemsCard />)
    expect(screen.getByRole('group', { name: 'Access points' })).toHaveTextContent('3/4')
    expect(tile('Access points').getByText('Online')).toBeInTheDocument()
  })

  it('counts an access point HA does not have as offline', () => {
    // The basement access point is configured but missing.
    load(ap('office', 'connected'), ap('hallway', 'connected'), ap('garage', 'connected'))
    render(<SystemsCard />)
    expect(screen.getByRole('group', { name: 'Access points' })).toHaveTextContent('3/4')
  })

  it('counts access points against their own up state, not the status entity', () => {
    const config: HomeConfig = {
      ...testHomeConfig,
      systems: {
        ...testHomeConfig.systems!,
        status: { entity_id: 'sensor.gateway_state', upState: 'on', label: 'Gateway' },
      },
    }
    load(
      status('on'),
      ...['office', 'hallway', 'garage', 'basement'].map((id) => ap(id, 'connected')),
    )
    render(<SystemsCard />, { config })
    expect(screen.getByRole('group', { name: 'Access points' })).toHaveTextContent('4/4')
  })

  it('shows when the last backup succeeded', () => {
    const backup = (state: string) =>
      sensorState({ entity_id: 'sensor.backup_last_successful_automatic_backup', state })
    load(backup(new Date(2026, 9, 4, 3, 10).toISOString()))
    const { unmount } = render(<SystemsCard />)
    expect(tile('Last backup').getByText('Today')).toBeInTheDocument()
    expect(tile('Last backup').getByText(/3:10/)).toBeInTheDocument()
    unmount()
    load(backup(new Date(2026, 9, 3, 23, 30).toISOString()))
    const second = render(<SystemsCard />)
    expect(tile('Last backup').getByText('Yesterday')).toBeInTheDocument()
    second.unmount()
    load(backup(new Date(2026, 8, 20, 9, 0).toISOString()))
    render(<SystemsCard />)
    // An older one shows its date, in the browser's locale (systemsViewModel.test.ts pins it).
    expect(screen.getByRole('group', { name: 'Last backup' })).toHaveTextContent(/20/)
    expect(screen.getByRole('group', { name: 'Last backup' })).not.toHaveTextContent(
      /Today|Yesterday/,
    )
  })

  it('counts every update entity that has an update ready', () => {
    load(
      updateState({ entity_id: 'update.router_firmware', state: 'on' }),
      updateState({ entity_id: 'update.some_integration', state: 'on' }),
      updateState({ entity_id: 'update.other', state: 'off' }),
    )
    render(<SystemsCard />)
    expect(tile('Updates').getByText('2')).toBeInTheDocument()
    expect(tile('Updates').getByText('Ready to install')).toBeInTheDocument()
  })

  it('says Up to date when no update is ready', () => {
    load(updateState({ entity_id: 'update.other', state: 'off' }))
    render(<SystemsCard />)
    expect(tile('Updates').getByText('0')).toBeInTheDocument()
    expect(tile('Updates').getByText('Up to date')).toBeInTheDocument()
  })

  it('leaves out the tiles whose config is not set', () => {
    const { uptime: _u, accessPoints: _a, backup: _b, ...rest } = testHomeConfig.systems!
    load(status('connected'))
    render(<SystemsCard />, { config: { ...testHomeConfig, systems: rest } })
    expect(screen.queryByRole('group', { name: 'Uptime' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Access points' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Last backup' })).toBeNull()
    expect(screen.getByRole('group', { name: 'Updates' })).toBeInTheDocument()
  })

  it('shows a CPU bar for each configured device with its percentage', () => {
    load(
      sensorState({ entity_id: 'sensor.processor_use', state: '12' }),
      sensorState({ entity_id: 'sensor.gateway_cpu_utilization', state: '47' }),
    )
    render(<SystemsCard />)
    const card = within(screen.getByRole('group', { name: 'CPU usage' }))
    expect(card.getByText('Home Assistant')).toBeInTheDocument()
    expect(card.getByText('12%')).toBeInTheDocument()
    expect(card.getByText('Gateway')).toBeInTheDocument()
    expect(card.getByText('47%')).toBeInTheDocument()
  })

  it('exposes each CPU bar as a meter with its value', () => {
    load(
      sensorState({ entity_id: 'sensor.processor_use', state: '12.4' }),
      sensorState({ entity_id: 'sensor.gateway_cpu_utilization', state: '140' }),
    )
    render(<SystemsCard />)
    const ha = screen.getByRole('meter', { name: 'Home Assistant CPU' })
    expect(ha).toHaveAttribute('aria-valuenow', '12')
    expect(ha).toHaveAttribute('aria-valuemin', '0')
    expect(ha).toHaveAttribute('aria-valuemax', '100')
    // Values past 100 are clamped so the fill never overflows its track.
    expect(screen.getByRole('meter', { name: 'Gateway CPU' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('clamps a CPU reading below zero to 0%', () => {
    load(sensorState({ entity_id: 'sensor.processor_use', state: '-3' }))
    render(<SystemsCard />)
    expect(screen.getByRole('meter', { name: 'Home Assistant CPU' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
    expect(screen.getByRole('group', { name: 'CPU usage' })).toHaveTextContent('0%')
  })

  it('shows a dash instead of a bar when a CPU sensor is unavailable', () => {
    load(sensorState({ entity_id: 'sensor.processor_use', state: 'unavailable' }))
    render(<SystemsCard />)
    const card = within(screen.getByRole('group', { name: 'CPU usage' }))
    expect(card.queryByRole('meter', { name: 'Home Assistant CPU' })).toBeNull()
    expect(card.getByText('Home Assistant').closest('.cpu__row')).toHaveTextContent('—')
    // The second sensor does not exist at all.
    expect(card.getByText('Gateway').closest('.cpu__row')).toHaveTextContent('Missing')
  })

  it('shows no CPU bars when none are configured', () => {
    const { cpu: _c, ...rest } = testHomeConfig.systems!
    render(<SystemsCard />, { config: { ...testHomeConfig, systems: rest } })
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByRole('group', { name: 'CPU usage' })).toBeNull()
  })

  it('hides the Systems card when home config has no systems section', () => {
    const { systems: _s, ...config } = testHomeConfig
    render(<SystemsCard />, { config })
    expect(screen.queryByRole('region', { name: 'Systems' })).toBeNull()
  })
})
