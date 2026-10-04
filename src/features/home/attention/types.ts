import type { HaAction, LeftOnIcon } from '../../../config/homeConfig'

// What a runnable action sends. `ha` is the rule's configured HA action; the sensor and
// onState are for the send-time recheck, since the action may target a different entity
// (the opener, not the door sensor). `script` runs a script with no recheck: a reset is
// idempotent.
type RunnableTarget =
  | { ha: HaAction; onState: string; script?: undefined }
  | { script: string; ha?: undefined; onState?: undefined }

// The glyph on the action's icon button. The accessible name stays the label.
export type ActionIcon = 'power' | 'close-garage' | 'check' | 'cart'

// `confirmLabel` is set when a stray repeat tap does harm (a toggle, a reset), so it needs a
// second tap.
export type RunnableAction = {
  label: string
  icon: ActionIcon
  pendingLabel: string
  confirmLabel?: string
  sensorId: string
} & RunnableTarget

export type AttentionKind = 'left-on' | 'battery' | 'update' | 'toner' | 'filter' | 'missing'

// The badge glyph: a left-on rule's own pick, or fixed per kind.
export type AttentionIcon = LeftOnIcon | 'battery' | 'update' | 'filter' | 'toner' | 'missing'

export type AttentionItem = {
  id: string
  tier: 'urgent' | 'chore'
  kind: AttentionKind
  icon: AttentionIcon
  title: string
  detail: string
  action?: RunnableAction | { label: string; icon: ActionIcon; href: string }
}
