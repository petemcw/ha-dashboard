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

// How TodayCard.css colours the icon: an amber sun or moon, a pale cloud, or MDI's
// single-colour partly cloudy. Icons without a tone take the text colour.
export type WeatherIconTone = 'sun' | 'cloud' | 'partly'

export type WeatherIcon = { path: string; tone?: WeatherIconTone }

// One MDI path per HA condition value, each imported by name so Vite can tree-shake.
export function weatherIcon(condition: string): WeatherIcon {
  switch (condition) {
    case 'sunny':
      return { path: mdiWeatherSunny, tone: 'sun' }
    case 'clear-night':
      return { path: mdiWeatherNight, tone: 'sun' }
    case 'partlycloudy':
      return { path: mdiWeatherPartlyCloudy, tone: 'partly' }
    case 'cloudy':
      return { path: mdiWeatherCloudy, tone: 'cloud' }
    case 'fog':
      return { path: mdiWeatherFog }
    case 'hail':
      return { path: mdiWeatherHail }
    case 'lightning':
      return { path: mdiWeatherLightning }
    case 'lightning-rainy':
      return { path: mdiWeatherLightningRainy }
    case 'pouring':
      return { path: mdiWeatherPouring }
    case 'rainy':
      return { path: mdiWeatherRainy }
    case 'snowy':
      return { path: mdiWeatherSnowy }
    case 'snowy-rainy':
      return { path: mdiWeatherSnowyRainy }
    case 'windy':
      return { path: mdiWeatherWindy }
    case 'windy-variant':
      return { path: mdiWeatherWindyVariant }
    case 'exceptional':
      return { path: mdiWeatherTornado }
    default:
      return { path: mdiWeatherCloudy }
  }
}
