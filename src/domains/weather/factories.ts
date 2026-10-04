import type { HassEntity } from 'home-assistant-js-websocket'
import { entityState } from '../factories.ts'

export const DEFAULT_WEATHER_ID = 'weather.forecast_home'

export function weatherState(
  state: string,
  overrides: { entity_id?: string; attributes?: Record<string, unknown> } = {},
): HassEntity {
  return entityState({
    entity_id: overrides.entity_id ?? DEFAULT_WEATHER_ID,
    state,
    attributes: {
      friendly_name: 'Forecast Home',
      temperature: 54,
      temperature_unit: '°F',
      humidity: 62,
      wind_speed: 8,
      wind_speed_unit: 'mph',
      uv_index: 3,
      ...overrides.attributes,
    },
  })
}
