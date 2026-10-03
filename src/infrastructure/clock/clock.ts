import { useSyncExternalStore } from 'react'

export const TICK_MS = 30_000

type ClockOptions = { intervalMs?: number; now?: () => Date }

// One shared clock drives every duration rule, so items appear without a reload and
// a wall screen stays accurate. It only ticks while something is subscribed. The
// snapshot is replaced per tick (never per read) so useSyncExternalStore stays stable.
export function createClock({ intervalMs = TICK_MS, now = () => new Date() }: ClockOptions = {}) {
  let current = now()
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setInterval> | undefined

  const tick = () => {
    current = now()
    listeners.forEach((l) => l())
  }

  return {
    get: () => current,
    subscribe(listener: () => void) {
      if (listeners.size === 0) {
        // The last value may be old if nobody was listening.
        current = now()
        timer = setInterval(tick, intervalMs)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) clearInterval(timer)
      }
    },
  }
}

export const clock = createClock()

export function useNow(): Date {
  return useSyncExternalStore(clock.subscribe, clock.get)
}
