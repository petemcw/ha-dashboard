import { useEffect, useRef } from 'react'
import { setAppData } from '../../../infrastructure/appData/appData'
import { useAppData } from '../../../infrastructure/appData/useAppData'
import { useAppDataWriter } from '../../../infrastructure/appData/useAppDataWriter'
import { useNow } from '../../../infrastructure/clock/clock'
import { useEntitiesLoaded } from '../../../infrastructure/entities/useEntity'
import { getConnection } from '../../../infrastructure/ha/connection'
import { useConnectionStatus } from '../../../infrastructure/ha/useConnectionStatus'
import { useCurrentUser } from '../../../infrastructure/ha/useCurrentUser'
import { SNOOZES_KEY, addSnooze, cleanup, isSnoozed, parseSnoozes, removeSnooze } from './snoozes'

export type SnoozeDuration = 'day' | 'week'
const DURATION_MS: Record<SnoozeDuration, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
}

// Waits out flapping so admin clients don't race each other over the same key.
export const CLEANUP_DEBOUNCE_MS = 5_000

export type Snoozing = {
  isSnoozed: (id: string) => boolean
  until: (id: string) => Date | undefined
  // Admin, system data loaded, and the stored value is one we understand.
  canSnooze: boolean
  // False for an unknown version or junk: snooze state is unavailable, not "none".
  readable: boolean
  pending: boolean
  error?: string
  snooze: (id: string, duration: SnoozeDuration) => void
  unsnooze: (id: string) => void
}

export function useSnoozes(resolvedIds: string[], connect = getConnection): Snoozing {
  const now = useNow()
  const user = useCurrentUser(connect)
  const { value, loaded } = useAppData('system', SNOOZES_KEY, connect)
  const entitiesLoaded = useEntitiesLoaded()
  const connected = useConnectionStatus().kind === 'connected'
  const { snoozes, writable } = parseSnoozes(value)
  const isAdmin = user?.isAdmin === true
  const canSnooze = isAdmin && loaded && writable
  const writer = useAppDataWriter('system', SNOOZES_KEY, snoozes, canSnooze, connect)

  // The cleanup timer reads the latest values, not the ones from when it was scheduled.
  const latest = useRef({ snoozes, resolvedIds })
  useEffect(() => {
    latest.current = { snoozes, resolvedIds }
  })

  // Entities not loaded or system data not loaded must never read as "everything resolved".
  const cleanupDue =
    canSnooze && connected && entitiesLoaded && cleanup(snoozes, resolvedIds, now) !== null
  useEffect(() => {
    if (!cleanupDue) return
    const timer = setTimeout(() => {
      const next = cleanup(latest.current.snoozes, latest.current.resolvedIds, new Date())
      // Best effort: a failed cleanup is retried the next time the state changes.
      if (next) setAppData('system', SNOOZES_KEY, next, connect).catch(() => {})
    }, CLEANUP_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [cleanupDue, connect])

  return {
    isSnoozed: (id) => isSnoozed(snoozes, id, now),
    until: (id) => (snoozes[id] ? new Date(snoozes[id].until) : undefined),
    canSnooze,
    readable: writable,
    pending: writer.pending,
    error: writer.failed ? "Couldn't save the snooze. Only admins can snooze." : undefined,
    snooze: (id, duration) =>
      writer.write((s) => addSnooze(s, id, new Date(Date.now() + DURATION_MS[duration]), user!.id)),
    unsnooze: (id) => writer.write((s) => removeSnooze(s, id)),
  }
}
