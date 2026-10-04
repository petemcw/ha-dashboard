import type { LucideIcon } from 'lucide-react'
import type { EntityStatus } from '../entityStatus'

export type WeatherViewModel = {
  entity_id: string
  status: EntityStatus
  // HA's condition value ("partlycloudy", "clear-night"), when the entity reports one.
  condition?: string
  conditionLabel?: string
  icon: LucideIcon
  temperature?: number
  temperature_unit?: string
  humidity?: number
  wind_speed?: number
  wind_speed_unit?: string
  uv_index?: number
}
