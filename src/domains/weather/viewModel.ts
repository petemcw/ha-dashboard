import type { HassEntity } from 'home-assistant-js-websocket'
import { entityStatus } from '../entityStatus'
import type { WeatherViewModel } from './types'

// HA's fixed set of weather condition values, readable.
export function conditionLabel(condition: string): string {
  switch (condition) {
    case 'clear-night':
      return 'Clear night'
    case 'cloudy':
      return 'Cloudy'
    case 'exceptional':
      return 'Exceptional'
    case 'fog':
      return 'Fog'
    case 'hail':
      return 'Hail'
    case 'lightning':
      return 'Thunderstorm'
    case 'lightning-rainy':
      return 'Thunderstorm with rain'
    case 'partlycloudy':
      return 'Partly cloudy'
    case 'pouring':
      return 'Pouring rain'
    case 'rainy':
      return 'Rain'
    case 'snowy':
      return 'Snow'
    case 'snowy-rainy':
      return 'Sleet'
    case 'sunny':
      return 'Sunny'
    case 'windy':
    case 'windy-variant':
      return 'Windy'
    default: {
      // A value this build doesn't know: show it readable rather than hide it.
      const words = condition.replace(/[-_]/g, ' ')
      return words.charAt(0).toUpperCase() + words.slice(1)
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
  if (!entity || status !== 'ok') return { entity_id: entity?.entity_id ?? entityId, status }
  const a = entity.attributes
  return {
    entity_id: entity.entity_id,
    status,
    condition: entity.state,
    conditionLabel: conditionLabel(entity.state),
    temperature: num(a.temperature),
    temperatureUnit: str(a.temperature_unit),
    humidity: num(a.humidity),
    windSpeed: num(a.wind_speed),
    windSpeedUnit: str(a.wind_speed_unit),
    uvIndex: num(a.uv_index),
  }
}
