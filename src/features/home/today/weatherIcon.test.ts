import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Tornado,
  Wind,
} from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { weatherIcon } from './weatherIcon'

describe('weatherIcon', () => {
  it.each([
    ['sunny', Sun, 'sun'],
    ['clear-night', Moon, 'sun'],
    ['partlycloudy', CloudSun, 'partly'],
    ['cloudy', Cloud, 'cloud'],
  ] as const)('draws %s in the mock-up colours', (condition, Icon, tone) => {
    expect(weatherIcon(condition)).toEqual({ Icon, tone })
  })

  it.each([
    ['fog', CloudFog],
    ['hail', CloudHail],
    ['lightning', CloudLightning],
    ['lightning-rainy', CloudLightning],
    ['pouring', CloudRainWind],
    ['rainy', CloudRain],
    ['snowy', CloudSnow],
    ['snowy-rainy', CloudDrizzle],
    ['windy', Wind],
    ['windy-variant', Wind],
    ['exceptional', Tornado],
  ])('draws %s in the text colour', (condition, Icon) => {
    expect(weatherIcon(condition)).toEqual({ Icon })
  })

  it('draws a plain cloud for a condition this build does not know', () => {
    expect(weatherIcon('mystery-mist')).toEqual({ Icon: Cloud })
  })
})
