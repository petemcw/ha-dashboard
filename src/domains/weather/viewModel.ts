import type { LucideIcon } from 'lucide-react'
import {
  Cloud,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  CloudDrizzle,
  Moon,
  Sun,
  Tornado,
  Wind,
} from 'lucide-react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus } from '../entityStatus'
import type { WeatherViewModel } from './types'

type Condition = { label: string; icon: LucideIcon }

// HA's fixed set of weather condition values, in one place so labels and icons never drift.
// Each icon is imported by name; never an icon map (it would bundle all of lucide).
export function conditionInfo(condition: string): Condition {
  switch (condition) {
    case 'clear-night':
      return { label: 'Clear night', icon: Moon }
    case 'cloudy':
      return { label: 'Cloudy', icon: Cloud }
    case 'exceptional':
      return { label: 'Exceptional', icon: Tornado }
    case 'fog':
      return { label: 'Fog', icon: CloudFog }
    case 'hail':
      return { label: 'Hail', icon: CloudHail }
    case 'lightning':
      return { label: 'Thunderstorm', icon: CloudLightning }
    case 'lightning-rainy':
      return { label: 'Thunderstorm with rain', icon: CloudLightning }
    case 'partlycloudy':
      return { label: 'Partly cloudy', icon: CloudSun }
    case 'pouring':
      return { label: 'Pouring rain', icon: CloudRainWind }
    case 'rainy':
      return { label: 'Rain', icon: CloudRain }
    case 'snowy':
      return { label: 'Snow', icon: CloudSnow }
    case 'snowy-rainy':
      return { label: 'Sleet', icon: CloudDrizzle }
    case 'sunny':
      return { label: 'Sunny', icon: Sun }
    case 'windy':
    case 'windy-variant':
      return { label: 'Windy', icon: Wind }
    default: {
      // A value this build doesn't know: show it readable rather than hide it.
      const words = condition.replace(/[-_]/g, ' ')
      return { label: words.charAt(0).toUpperCase() + words.slice(1), icon: CloudMoon }
    }
  }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

export function weatherViewModel(
  entity: HassEntity | undefined,
  entityId = entity?.entity_id ?? '',
): WeatherViewModel {
  const status = entityStatus(entity)
  if (!entity || status !== 'ok') {
    return { entity_id: entity?.entity_id ?? entityId, status, icon: Cloud }
  }
  const info = conditionInfo(entity.state)
  const a = entity.attributes
  return {
    entity_id: entity.entity_id,
    status,
    condition: entity.state,
    conditionLabel: info.label,
    icon: info.icon,
    temperature: num(a.temperature),
    temperature_unit: str(a.temperature_unit),
    humidity: num(a.humidity),
    wind_speed: num(a.wind_speed),
    wind_speed_unit: str(a.wind_speed_unit),
    uv_index: num(a.uv_index),
  }
}
