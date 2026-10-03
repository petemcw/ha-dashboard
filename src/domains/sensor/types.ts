import type { EntityStatus } from '../entityStatus.ts'

export type SensorViewModel = {
  entity_id: string
  status: EntityStatus
  friendlyName: string
  deviceClass?: string
  // undefined for anything HA reports non-numerically (unavailable, unknown, text).
  numericValue?: number
}
