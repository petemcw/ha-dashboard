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
const weather = weatherViewModel(weatherState('partlycloudy'))
const sun = sunViewModel(sunState(at(3, 18, 52).toISOString()))
const build = (over: Partial<Parameters<typeof todayViewModel>[0]> = {}) =>
  todayViewModel({ weather, sun, daily: undefined, hourly: undefined, now: at(3, 18, 42), ...over })

describe('todayViewModel', () => {
  it('takes high and low from the daily entry dated today', () => {
    const vm = build({
      daily: [
        { datetime: at(3, 0).toISOString(), temperature: 61, templow: 44 },
        { datetime: at(4, 0).toISOString(), temperature: 70, templow: 50 },
      ],
    })
    expect(vm.high).toBe(61)
    expect(vm.low).toBe(44)
  })

  it('leaves out high and low when the daily list starts tomorrow', () => {
    const vm = build({
      daily: [{ datetime: at(4, 0).toISOString(), temperature: 70, templow: 50 }],
    })
    expect(vm.high).toBeUndefined()
    expect(vm.low).toBeUndefined()
  })

  it('leaves out high, low, and hours for a missing or empty forecast', () => {
    for (const forecast of [undefined, []]) {
      const vm = build({ daily: forecast, hourly: forecast })
      expect(vm).toMatchObject({ high: undefined, low: undefined, hours: [] })
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
    expect(vm.hours[0].temperature).toBe(49)
  })

  it('labels the first hour by its time when it has not started yet', () => {
    const vm = build({ hourly: [hourly(19, 50)], now: at(3, 18, 42) })
    expect(vm.hours[0].label).toBe('7p')
  })

  it('formats sunset as local time and omits it when the sun is missing', () => {
    expect(build().sunsetText).toBe('Sunset 6:52 pm')
    expect(build({ sun: sunViewModel(undefined, 'sun.sun') }).sunsetText).toBeUndefined()
  })
})
