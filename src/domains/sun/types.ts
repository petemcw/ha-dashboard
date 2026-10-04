import type { EntityStatus } from '../entityStatus'

export type SunViewModel = {
  entity_id: string
  status: EntityStatus
  // The next time the sun sets, when HA reports a valid timestamp.
  nextSetting?: Date
}
