import type { EntityStatus } from '../entityStatus.ts'

export type UpdateViewModel = {
  entity_id: string
  status: EntityStatus
  friendlyName: string
  // HA's update entity is `on` when an update is available.
  isPending: boolean
  installedVersion?: string
  latestVersion?: string
}
