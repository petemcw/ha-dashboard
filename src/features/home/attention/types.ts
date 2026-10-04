import type { HaAction } from '../../../config/homeConfig'

// What a runnable action sends. `ha` is the rule's configured HA action; the sensor and
// onState are for the send-time recheck, since the action may target a different entity
// (the opener, not the door sensor). `script` runs a script with no recheck: a reset is
// idempotent.
type RunnableTarget =
  | { ha: HaAction; onState: string; script?: undefined }
  | { script: string; ha?: undefined; onState?: undefined }

// `confirmLabel` is set when a stray repeat tap does harm (a toggle, a reset), so it needs a
// second tap.
export type RunnableAction = {
  label: string
  pendingLabel: string
  confirmLabel?: string
  sensorId: string
} & RunnableTarget

export type AttentionItem = {
  id: string
  tier: 'urgent' | 'chore'
  title: string
  detail: string
  action?: RunnableAction | { label: string; href: string }
}
