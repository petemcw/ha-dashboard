import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sunState } from '../../../domains/sun/factories'
import { sunViewModel } from '../../../domains/sun/viewModel'
import { weatherState } from '../../../domains/weather/factories'
import { weatherViewModel } from '../../../domains/weather/viewModel'
import { TodayCard } from './TodayCard'
import { todayViewModel } from './todayViewModel'

const at = (hour: number) => new Date(2026, 9, 3, hour, 0)
const now = at(18)

function card(over: Parameters<typeof todayViewModel>[0] extends infer T ? Partial<T> : never) {
  render(
    <TodayCard
      vm={todayViewModel({
        weather: weatherViewModel(weatherState('partlycloudy')),
        sun: sunViewModel(sunState(new Date(2026, 9, 3, 18, 52).toISOString())),
        daily: undefined,
        hourly: undefined,
        now,
        locale: 'en-US',
        ...over,
      })}
    />,
  )
  return screen.getByRole('region', { name: 'Today' })
}

describe('TodayCard', () => {
  it('shows the current temperature and condition on the Today card', () => {
    const region = card({})
    expect(within(region).getByText('54°')).toBeInTheDocument()
    expect(within(region).getByText('Partly cloudy')).toBeInTheDocument()
  })

  it("shows today's high and low from the daily forecast", () => {
    const region = card({
      daily: [{ datetime: at(0).toISOString(), temperature: 61, templow: 44 }],
    })
    expect(within(region).getByText('High 61° · Low 44°')).toBeInTheDocument()
  })

  it('shows humidity, wind, and UV from the weather entity', () => {
    const region = card({})
    expect(within(region).getByText('Humidity').nextSibling).toHaveTextContent('62%')
    expect(within(region).getByText('Wind').nextSibling).toHaveTextContent('8 mph')
    expect(within(region).getByText('UV').nextSibling).toHaveTextContent('3')
  })

  it('shows the next seven hours from the hourly forecast', () => {
    const hourly = Array.from({ length: 10 }, (_, i) => ({
      datetime: at(18 + i).toISOString(),
      condition: 'cloudy',
      temperature: 50 + i,
    }))
    const region = card({ hourly })
    const items = within(region).getAllByRole('listitem')
    expect(items).toHaveLength(7)
    expect(items[0]).toHaveTextContent('Now')
    expect(items[0]).toHaveTextContent('50°')
    expect(items[1]).toHaveTextContent('7p')
    expect(items[6]).toHaveTextContent('56°')
  })

  it('shows the sunset time from the sun entity', () => {
    expect(within(card({})).getByText('Sunset 6:52 pm')).toBeInTheDocument()
  })

  it('shows Missing and no forecast when the weather entity does not exist', () => {
    const region = card({ weather: weatherViewModel(undefined, 'weather.nope') })
    expect(within(region).getByText('Missing')).toBeInTheDocument()
    expect(within(region).queryByRole('list')).not.toBeInTheDocument()
  })

  it.each([
    ['unavailable', 'Unavailable'],
    ['unknown', 'Unknown'],
  ])('shows %s weather as %s, with no readings', (state, text) => {
    const region = card({ weather: weatherViewModel(weatherState(state)) })
    expect(within(region).getByText(text)).toBeInTheDocument()
    expect(within(region).queryByText('Humidity')).not.toBeInTheDocument()
    expect(within(region).queryByText('54°')).not.toBeInTheDocument()
  })

  it('names each hour by its condition for screen readers', () => {
    const region = card({
      hourly: [{ datetime: at(18).toISOString(), condition: 'clear-night', temperature: 50 }],
    })
    expect(within(region).getByRole('img', { name: 'Clear night' })).toBeInTheDocument()
  })
})
