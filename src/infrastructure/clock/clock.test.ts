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
})
