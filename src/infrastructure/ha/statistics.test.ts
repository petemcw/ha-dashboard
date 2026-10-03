import { act, renderHook } from '@testing-library/react'
import type { Connection } from 'home-assistant-js-websocket'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHourlyMeans } from './statistics'
import { useHourlyMeans } from './useHourlyMeans'

const rows = (...means: (number | null)[]) =>
  means.map((mean, i) => ({ start: i, end: i + 1, mean }))

function fakeConn(result: unknown) {
  const listeners = new Map<string, () => void>()
  const send = vi.fn().mockResolvedValue(result)
  const conn = {
    sendMessagePromise: send,
    addEventListener: (t: string, l: () => void) => listeners.set(t, l),
    removeEventListener: (t: string) => listeners.delete(t),
  } as unknown as Connection
  return { conn, send, fire: (t: string) => listeners.get(t)?.() }
}

afterEach(() => vi.useRealTimers())

describe('hourly statistics', () => {
  it('asks recorder for hourly means over the window and returns them oldest first', async () => {
    const { conn, send } = fakeConn({ 'sensor.a': rows(1, 2, 3) })
    const now = Date.parse('2026-10-03T12:00:00Z')
    expect(await fetchHourlyMeans(conn, ['sensor.a'], 24, now)).toEqual({ 'sensor.a': [1, 2, 3] })
    expect(send).toHaveBeenCalledWith({
      type: 'recorder/statistics_during_period',
      start_time: '2026-10-02T12:00:00.000Z',
      end_time: '2026-10-03T12:00:00.000Z',
      statistic_ids: ['sensor.a'],
      period: 'hour',
      types: ['mean'],
    })
  })

  it('skips hours without a mean and ids without statistics', async () => {
    const { conn } = fakeConn({ 'sensor.a': rows(null, 2), 'sensor.b': rows(null), 'sensor.c': [] })
    expect(await fetchHourlyMeans(conn, ['sensor.a', 'sensor.b', 'sensor.c'], 24)).toEqual({
      'sensor.a': [2],
    })
  })

  it('refetches every 15 minutes and after a reconnect, and keeps the last series on failure', async () => {
    vi.useFakeTimers()
    const { conn, send, fire } = fakeConn({ 'sensor.a': rows(1) })
    const connect = () => Promise.resolve(conn)
    const { result } = renderHook(() => useHourlyMeans(['sensor.a'], 24, connect))
    await act(async () => {})
    expect(result.current).toEqual({ 'sensor.a': [1] })
    expect(send).toHaveBeenCalledTimes(1)

    send.mockRejectedValueOnce(new Error('down'))
    await act(async () => vi.advanceTimersByTimeAsync(15 * 60_000))
    expect(send).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ 'sensor.a': [1] })

    send.mockResolvedValue({ 'sensor.a': rows(5) })
    await act(async () => fire('ready'))
    expect(send).toHaveBeenCalledTimes(3)
    expect(result.current).toEqual({ 'sensor.a': [5] })
  })
})
