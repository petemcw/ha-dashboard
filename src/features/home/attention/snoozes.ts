export const SNOOZES_KEY = 'ha-dashboard:snoozes'

export type Snooze = { until: string; by: string }
export type Snoozes = Record<string, Snooze>
export type SnoozesValue = { version: 1; snoozes: Snoozes }

const isTime = (s: unknown): s is string => typeof s === 'string' && !Number.isNaN(Date.parse(s))

// `writable: false` means the stored value isn't ours (unknown version or junk). Show no
// snoozes, but never write: that would overwrite someone else's data.
export function parseSnoozes(value: unknown): { snoozes: Snoozes; writable: boolean } {
  if (value === null || value === undefined) return { snoozes: {}, writable: true }
  const v = value as { version?: unknown; snoozes?: unknown }
  const ok =
    typeof value === 'object' &&
    v.version === 1 &&
    typeof v.snoozes === 'object' &&
    v.snoozes !== null &&
    !Array.isArray(v.snoozes)
  if (!ok) return { snoozes: {}, writable: false }
  const snoozes: Snoozes = {}
  for (const [id, entry] of Object.entries(v.snoozes as Record<string, Partial<Snooze>>)) {
    if (entry && isTime(entry.until) && typeof entry.by === 'string') {
      snoozes[id] = { until: entry.until, by: entry.by }
    }
  }
  return { snoozes, writable: true }
}

export const isSnoozed = (snoozes: Snoozes, id: string, now: Date) => {
  const entry = snoozes[id]
  return entry !== undefined && now.getTime() < Date.parse(entry.until)
}

const toValue = (snoozes: Snoozes): SnoozesValue => ({ version: 1, snoozes })

export const addSnooze = (snoozes: Snoozes, id: string, until: Date, by: string): SnoozesValue =>
  toValue({ ...snoozes, [id]: { until: until.toISOString(), by } })

export function removeSnooze(snoozes: Snoozes, id: string): SnoozesValue {
  const { [id]: _removed, ...rest } = snoozes
  return toValue(rest)
}

// Only an item that resolved, or a snooze that ran out, is dropped. An item that merely
// isn't active (unavailable, missing, or under its duration after an HA restart) keeps it.
// Returns null when nothing changed so callers don't write.
export function cleanup(snoozes: Snoozes, resolvedIds: string[], now: Date): SnoozesValue | null {
  const resolved = new Set(resolvedIds)
  const kept = Object.entries(snoozes).filter(
    ([id, s]) => !resolved.has(id) && now.getTime() < Date.parse(s.until),
  )
  return kept.length === Object.keys(snoozes).length ? null : toValue(Object.fromEntries(kept))
}

// "Sun 9:00 AM": a snooze is at most a week, so the weekday and time say when.
export const formatUntil = (d: Date) =>
  d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
