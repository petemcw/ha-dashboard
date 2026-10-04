import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClock } from './clock'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('clock', () => {
  it('ticks with the injected time source while subscribed and stops after unsubscribing', () => {
    let t = 0
    const clock = createClock({ intervalMs: 1000, now: () => new Date(t) })
    const seen: number[] = []
    const off = clock.subscribe(() => seen.push(clock.get().getTime()))

    t = 1000
    vi.advanceTimersByTime(1000)
    t = 2000
    vi.advanceTimersByTime(1000)
    expect(seen).toEqual([1000, 2000])

    off()
    vi.advanceTimersByTime(5000)
    expect(seen).toHaveLength(2)
  })

  it('refreshes to the current time when a subscriber arrives after an idle period', () => {
    let t = 0
    const clock = createClock({ now: () => new Date(t) })
    t = 99_000
    clock.subscribe(() => {})
    expect(clock.get().getTime()).toBe(99_000)
  })

  it('ticks the shared clock on the wall-clock minute rather than 30 seconds after the first subscriber', () => {
    vi.setSystemTime(new Date('2026-10-03T18:41:47Z'))
    const clock = createClock()
    const seen: number[] = []
    clock.subscribe(() => seen.push(clock.get().getTime()))

    vi.advanceTimersByTime(12_999)
    expect(seen).toEqual([])
    vi.advanceTimersByTime(1)
    expect(seen).toEqual([new Date('2026-10-03T18:42:00Z').getTime()])
    vi.advanceTimersByTime(30_000)
    expect(seen).toHaveLength(2)
    expect(clock.get().getTime()).toBe(new Date('2026-10-03T18:42:30Z').getTime())
  })

  it('lands the tick after a late one back on the :00 or :30 mark', () => {
    const start = new Date('2026-10-03T18:42:00Z').getTime()
    vi.setSystemTime(start)
    // The wall clock runs `lateBy` ahead of the timers: a busy or throttled page fired the
    // timer that much after it was due.
    let lateBy = 0
    const clock = createClock({ now: () => new Date(Date.now() + lateBy) })
    const seen: number[] = []
    clock.subscribe(() => seen.push(clock.get().getTime()))

    lateBy = 700
    vi.advanceTimersByTime(30_000)
    expect(seen).toEqual([start + 30_700])

    vi.advanceTimersByTime(30_000)
    expect(seen[1]).toBe(new Date('2026-10-03T18:43:00Z').getTime())
  })
})
