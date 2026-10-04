import type { AttentionItem } from './types'

// An id is resolved only when its entity is present and available and the condition
// has cleared. Snooze cleanup keys off this, so unavailable, missing, or "on but under
// the duration" (what HA's last_changed reset looks like after a restart) must not count.
export type RuleResult = { items: AttentionItem[]; resolvedIds: string[] }

// Neither active nor resolved: we don't know (unavailable, unknown, under the threshold).
export const UNDECIDED: RuleResult = { items: [], resolvedIds: [] }

export const active = (item: AttentionItem): RuleResult => ({ items: [item], resolvedIds: [] })

export const resolved = (id: string): RuleResult => ({ items: [], resolvedIds: [id] })

// A configured entity HA doesn't have: a visible chore, never silence.
export const missingEntity = (entityId: string): RuleResult =>
  active({
    id: `missing:${entityId}`,
    tier: 'chore',
    kind: 'missing',
    title: 'Missing entity',
    detail: entityId,
  })

export const mergeResults = (results: RuleResult[]): RuleResult => ({
  items: results.flatMap((r) => r.items),
  resolvedIds: results.flatMap((r) => r.resolvedIds),
})
