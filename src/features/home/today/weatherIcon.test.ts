import {
  mdiWeatherCloudy,
  mdiWeatherFog,
  mdiWeatherHail,
  mdiWeatherLightning,
  mdiWeatherLightningRainy,
  mdiWeatherNight,
  mdiWeatherPartlyCloudy,
  mdiWeatherPouring,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSnowyRainy,
  mdiWeatherSunny,
  mdiWeatherTornado,
  mdiWeatherWindy,
  mdiWeatherWindyVariant,
} from '@mdi/js'
import { describe, expect, it } from 'vitest'
import { weatherIcon } from './weatherIcon'

describe('weatherIcon', () => {
  it.each([
    ['sunny', mdiWeatherSunny, 'sun'],
    ['clear-night', mdiWeatherNight, 'sun'],
    ['partlycloudy', mdiWeatherPartlyCloudy, 'partly'],
    ['cloudy', mdiWeatherCloudy, 'cloud'],
  ] as const)('draws %s in the mock-up colours', (condition, path, tone) => {
    expect(weatherIcon(condition)).toEqual({ path, tone })
  })

  it.each([
    ['fog', mdiWeatherFog],
    ['hail', mdiWeatherHail],
    ['lightning', mdiWeatherLightning],
    ['lightning-rainy', mdiWeatherLightningRainy],
    ['pouring', mdiWeatherPouring],
    ['rainy', mdiWeatherRainy],
    ['snowy', mdiWeatherSnowy],
    ['snowy-rainy', mdiWeatherSnowyRainy],
    ['windy', mdiWeatherWindy],
    ['windy-variant', mdiWeatherWindyVariant],
    ['exceptional', mdiWeatherTornado],
  ])('maps %s to an MDI weather icon in the text colour', (condition, path) => {
    expect(weatherIcon(condition)).toEqual({ path })
  })

  it('falls back to a neutral weather icon for an unknown condition', () => {
    expect(weatherIcon('mystery-mist')).toEqual({ path: mdiWeatherCloudy })
  })
})
