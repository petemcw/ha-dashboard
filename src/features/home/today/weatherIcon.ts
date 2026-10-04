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
  type LucideIcon,
} from 'lucide-react'

// How TodayCard.css colours the icon, after the mock-up: an amber sun or moon, a pale
// cloud, or both. Icons without a tone take the text colour.
export type WeatherIconTone = 'sun' | 'cloud' | 'partly'

export type WeatherIcon = { Icon: LucideIcon; tone?: WeatherIconTone }

// One icon per HA condition value. Each icon is imported by name; never an icon map, which
// would bundle all of lucide.
export function weatherIcon(condition: string): WeatherIcon {
  switch (condition) {
    case 'sunny':
      return { Icon: Sun, tone: 'sun' }
    case 'clear-night':
      return { Icon: Moon, tone: 'sun' }
    case 'partlycloudy':
      return { Icon: CloudSun, tone: 'partly' }
    case 'cloudy':
      return { Icon: Cloud, tone: 'cloud' }
    case 'fog':
      return { Icon: CloudFog }
    case 'hail':
      return { Icon: CloudHail }
    case 'lightning':
    case 'lightning-rainy':
      return { Icon: CloudLightning }
    case 'pouring':
      return { Icon: CloudRainWind }
    case 'rainy':
      return { Icon: CloudRain }
    case 'snowy':
      return { Icon: CloudSnow }
    case 'snowy-rainy':
      return { Icon: CloudDrizzle }
    case 'windy':
    case 'windy-variant':
      return { Icon: Wind }
    case 'exceptional':
      return { Icon: Tornado }
    default:
      return { Icon: Cloud }
  }
}
