import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { sunState } from '../../../domains/sun/factories'
import { weatherState } from '../../../domains/weather/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { renderWithHome as render } from '../../../test/renderWithHome'

// The connection at the library boundary: answers each forecast subscription with the
// forecast for its type, the way HA pushes one right after subscribing.
const commands: Record<string, unknown>[] = []
const forecasts: Record<string, unknown[]> = {}
vi.mock('../../../infrastructure/ha/connection', () => ({
  getConnection: () =>
    Promise.resolve({
      subscribeMessage: (cb: (ev: unknown) => void, command: Record<string, unknown>) => {
        commands.push(command)
        const type = String(command.forecast_type)
        queueMicrotask(() => cb({ type, forecast: forecasts[type] }))
        return Promise.resolve(() => Promise.resolve())
      },
    }),
}))

import { TodaySection } from './TodaySection'

const { weather } = testHomeConfig
if (!weather) throw new Error('testHomeConfig needs a weather section')

// Built from the real clock, as the section reads it, in local time.
const hourStart = new Date()
hourStart.setMinutes(0, 0, 0)
forecasts.hourly = Array.from({ length: 9 }, (_, i) => ({
  datetime: new Date(hourStart.getTime() + i * 3_600_000).toISOString(),
  condition: 'cloudy',
  temperature: 40 + i,
}))
const noon = new Date()
noon.setHours(12, 0, 0, 0)
forecasts.daily = [
  { datetime: noon.toISOString(), condition: 'sunny', temperature: 61, templow: 44 },
]

afterEach(() => {
  entityStore.reset()
  commands.length = 0
})

describe('Today section', () => {
  it('shows nothing when home config has no weather section', () => {
    const { weather: _weather, ...rest } = testHomeConfig
    render(<TodaySection />, { config: rest })
    act(() => entityStore.setEntities({}))
    expect(screen.queryByRole('region', { name: 'Today' })).not.toBeInTheDocument()
    expect(commands).toEqual([])
  })

  it('shows the configured weather entity with its forecasts and the sunset', async () => {
    render(<TodaySection />)
    const sunset = new Date(Date.now() + 2 * 3_600_000).toISOString()
    act(() =>
      entityStore.setEntities({
        [weather.entity_id]: weatherState('partlycloudy', { entity_id: weather.entity_id }),
        [weather.sun]: sunState(sunset, 'above_horizon', weather.sun),
      }),
    )
    const region = screen.getByRole('region', { name: 'Today' })
    expect(within(region).getByText('Partly cloudy')).toBeInTheDocument()
    expect(await within(region).findByText('High 61° · Low 44°')).toBeInTheDocument()
    const hours = await within(region).findAllByRole('listitem')
    expect(hours).toHaveLength(7)
    expect(hours[0]).toHaveTextContent('Now')
    expect(hours[0]).toHaveTextContent('40°')
    expect(within(region).getByText(/^Sunset /)).toBeInTheDocument()
    expect(commands).toEqual(
      expect.arrayContaining(
        ['hourly', 'daily'].map((forecast_type) => ({
          type: 'weather/subscribe_forecast',
          entity_id: weather.entity_id,
          forecast_type,
        })),
      ),
    )
  })

  it('shows Missing when the configured weather entity does not exist', () => {
    render(<TodaySection />)
    act(() => entityStore.setEntities({}))
    const region = screen.getByRole('region', { name: 'Today' })
    expect(within(region).getByText('Missing')).toBeInTheDocument()
  })
})
