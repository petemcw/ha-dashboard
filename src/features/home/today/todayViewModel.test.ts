import { describe, expect, it } from 'vitest'
import type { ForecastEntry } from '../../../infrastructure/ha/forecast'
import { sunState } from '../../../domains/sun/factories'
import { sunViewModel } from '../../../domains/sun/viewModel'
import { weatherState } from '../../../domains/weather/factories'
import { weatherViewModel } from '../../../domains/weather/viewModel'
import { todayViewModel } from './todayViewModel'

// Local-time dates so the expectations hold in any timezone.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute)
const hourly = (hour: number, temperature: number, condition = 'cloudy'): ForecastEntry => ({
  datetime: at(3, hour).toISOString(),
  temperature,
  condition,
})
const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
// "2026-10-03T00:00:00-05:00": local midnight written with this machine's own UTC offset,
// the way a provider that reports in the home's timezone sends a day.
function localMidnightWithOffset(day: number) {
  const offset = -at(day, 0).getTimezoneOffset()
  const sign = offset < 0 ? '-' : '+'
  return `2026-10-${pad(day)}T00:00:00${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`
}
// "2026-10-03T17:00:00+00:00": a local-noon instant in UTC, the way the live met.no entity
// sends each day.
const localNoonInUtc = (day: number) => `${at(day, 12).toISOString().slice(0, 19)}+00:00`

const weather = weatherViewModel(weatherState('partlycloudy'))
const sun = sunViewModel(sunState(at(3, 18, 52).toISOString()))
const build = (over: Partial<Parameters<typeof todayViewModel>[0]> = {}) =>
  todayViewModel({
    weather,
    sun,
    daily: undefined,
    hourly: undefined,
    now: at(3, 18, 42),
    locale: 'en-US',
    ...over,
  })

describe('todayViewModel', () => {
  it('writes the temperature, condition, and stats as finished text', () => {
    expect(build()).toMatchObject({
      status: 'ok',
      condition: 'partlycloudy',
      conditionLabel: 'Partly cloudy',
      temperatureText: '54°',
      stats: [
        { label: 'Humidity', value: '62%' },
        { label: 'Wind', value: '8 mph' },
        { label: 'UV', value: '3' },
      ],
    })
  })

  it('rounds the readings and dashes the ones HA does not send', () => {
    const vm = build({
      weather: weatherViewModel(
        weatherState('sunny', {
          attributes: {
            temperature: 53.6,
            humidity: 61.5,
            wind_speed: 7.4,
            wind_speed_unit: undefined,
            uv_index: undefined,
          },
        }),
      ),
    })
    expect(vm.temperatureText).toBe('54°')
    expect(vm.stats).toEqual([
      { label: 'Humidity', value: '62%' },
      { label: 'Wind', value: '7' },
      { label: 'UV', value: '–' },
    ])
  })

  it('takes high and low from the daily entry dated today', () => {
    const vm = build({
      daily: [
        { datetime: at(3, 0).toISOString(), temperature: 61, templow: 44 },
        { datetime: at(4, 0).toISOString(), temperature: 70, templow: 50 },
      ],
    })
    expect(vm.highLowText).toBe('High 61° · Low 44°')
  })

  it('dashes a missing low when the day has only a high', () => {
    const vm = build({ daily: [{ datetime: at(3, 0).toISOString(), temperature: 61.4 }] })
    expect(vm.highLowText).toBe('High 61° · Low –')
  })

  it.each([
    ['a local-noon instant in UTC, as met.no sends', localNoonInUtc],
    ['local midnight with the home offset', localMidnightWithOffset],
    ['UTC midnight, the calendar date', (day: number) => `2026-10-${pad(day)}T00:00:00+00:00`],
    ['a bare date', (day: number) => `2026-10-${pad(day)}`],
  ])('reads the day of each daily entry written as %s', (_format, datetime) => {
    const daily = [2, 3, 4].map((day) => ({
      datetime: datetime(day),
      temperature: 60 + day,
      templow: 40 + day,
    }))
    for (const now of [at(3, 0, 30), at(3, 12), at(3, 23, 30)]) {
      expect(build({ daily, now }).highLowText).toBe('High 63° · Low 43°')
    }
  })

  it('leaves out high and low when the daily list starts tomorrow', () => {
    const vm = build({
      daily: [{ datetime: at(4, 0).toISOString(), temperature: 70, templow: 50 }],
    })
    expect(vm.highLowText).toBeUndefined()
  })

  it('leaves out high, low, and hours for a missing or empty forecast', () => {
    for (const forecast of [undefined, []]) {
      const vm = build({ daily: forecast, hourly: forecast })
      expect(vm).toMatchObject({ highLowText: undefined, hours: [] })
    }
  })

  it('lists the next seven hours starting with Now, skipping hours already past', () => {
    const vm = build({
      hourly: [17, 18, 19, 20, 21, 22, 23, 0, 1].map((h, i) => ({
        datetime: at(h < 17 ? 4 : 3, h).toISOString(),
        temperature: 50 - i,
        condition: 'cloudy',
      })),
    })
    expect(vm.hours.map((h) => h.label)).toEqual(['Now', '7p', '8p', '9p', '10p', '11p', '12a'])
    expect(vm.hours[0]).toMatchObject({
      temperatureText: '49°',
      condition: 'cloudy',
      conditionLabel: 'Cloudy',
    })
  })

  it('labels hours the 24-hour way in a 24-hour locale', () => {
    const vm = build({ hourly: [hourly(18, 50), hourly(19, 49)], locale: 'en-GB' })
    expect(vm.hours.map((h) => h.label)).toEqual(['Now', '19'])
  })

  it('labels the first hour by its time when it has not started yet', () => {
    const vm = build({ hourly: [hourly(19, 50)], now: at(3, 18, 42) })
    expect(vm.hours[0].label).toBe('7p')
  })

  it('dashes an hour without a temperature and leaves out its condition', () => {
    const vm = build({ hourly: [{ datetime: at(3, 19).toISOString() }] })
    expect(vm.hours[0]).toEqual({ key: at(3, 19).toISOString(), label: '7p', temperatureText: '–' })
  })

  it('formats sunset in the locale and omits it when the sun is missing', () => {
    expect(build().sunsetText).toBe('Sunset 6:52 pm')
    expect(build({ locale: 'en-GB' }).sunsetText).toBe('Sunset 18:52')
    expect(build({ sun: sunViewModel(undefined, 'sun.sun') }).sunsetText).toBeUndefined()
  })

  it('carries the weather status and no readings when the weather is not ok', () => {
    const vm = build({ weather: weatherViewModel(weatherState('unavailable')) })
    expect(vm).toMatchObject({ status: 'unavailable', conditionLabel: undefined })
  })
})
