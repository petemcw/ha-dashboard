import { describe, expect, it } from 'vitest'
import { weatherState } from './factories'
import { conditionLabel, weatherViewModel } from './viewModel'

describe('weatherViewModel', () => {
  it('maps a weather entity to its temperature, unit, condition, and condition label', () => {
    expect(weatherViewModel(weatherState('partlycloudy'))).toEqual({
      entity_id: 'weather.forecast_home',
      status: 'ok',
      condition: 'partlycloudy',
      conditionLabel: 'Partly cloudy',
      temperature: 54,
      temperatureUnit: '°F',
      humidity: 62,
      windSpeed: 8,
      windSpeedUnit: 'mph',
      uvIndex: 3,
    })
  })

  it('reads humidity, wind, and UV from attributes', () => {
    expect(weatherViewModel(weatherState('sunny'))).toMatchObject({
      humidity: 62,
      windSpeed: 8,
      windSpeedUnit: 'mph',
      uvIndex: 3,
    })
  })

  it('leaves attributes out when HA does not send them or sends the wrong type', () => {
    const vm = weatherViewModel(
      weatherState('sunny', { attributes: { humidity: '62', uv_index: undefined } }),
    )
    expect(vm.humidity).toBeUndefined()
    expect(vm.uvIndex).toBeUndefined()
  })

  it('is missing when the entity does not exist', () => {
    expect(weatherViewModel(undefined, 'weather.nope')).toMatchObject({
      entity_id: 'weather.nope',
      status: 'missing',
    })
  })

  it.each(['unavailable', 'unknown'])('reports %s without a condition', (state) => {
    expect(weatherViewModel(weatherState(state))).toEqual({
      entity_id: 'weather.forecast_home',
      status: state,
    })
  })

  it('labels an unfamiliar condition by tidying HA value', () => {
    expect(weatherViewModel(weatherState('lightning-rainy')).conditionLabel).toBe(
      'Thunderstorm with rain',
    )
    expect(weatherViewModel(weatherState('mystery-mist')).conditionLabel).toBe('Mystery mist')
  })

  it.each([
    ['clear-night', 'Clear night'],
    ['cloudy', 'Cloudy'],
    ['exceptional', 'Exceptional'],
    ['fog', 'Fog'],
    ['hail', 'Hail'],
    ['lightning', 'Thunderstorm'],
    ['pouring', 'Pouring rain'],
    ['rainy', 'Rain'],
    ['snowy', 'Snow'],
    ['snowy-rainy', 'Sleet'],
    ['sunny', 'Sunny'],
    ['windy', 'Windy'],
    ['windy-variant', 'Windy'],
  ])('labels the %s condition as %s', (condition, label) => {
    expect(weatherViewModel(weatherState(condition)).conditionLabel).toBe(label)
    expect(conditionLabel(condition)).toBe(label)
  })
})
