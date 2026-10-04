import type { EntityStatus } from '../entityStatus'

export type WeatherViewModel = {
  entity_id: string
  status: EntityStatus
  // HA's condition value ("partlycloudy", "clear-night"), when the entity reports one.
  // Features pick an icon for it; the domain stays free of UI components.
  condition?: string
  conditionLabel?: string
  temperature?: number
  temperatureUnit?: string
  humidity?: number
  windSpeed?: number
  windSpeedUnit?: string
  uvIndex?: number
}
