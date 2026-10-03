import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeConnection } from '../../test/fakeConnection'
import { startHeartbeat } from './heartbeat'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('heartbeat', () => {
  it('pings every 30 seconds while the socket answers', async () => {
    const fake = createFakeConnection()
    startHeartbeat(fake.conn)
    await vi.advanceTimersByTimeAsync(90_000)
    expect(fake.heartbeat.pings).toBe(3)
    expect(fake.heartbeat.reconnects).toEqual([])
  })

  it('forces a reconnect when a ping gets no pong within 10 seconds', async () => {
    const fake = createFakeConnection()
    fake.heartbeat.answerPings = false
    startHeartbeat(fake.conn)
    await vi.advanceTimersByTimeAsync(30_000)
    await vi.advanceTimersByTimeAsync(9_000)
    expect(fake.heartbeat.reconnects).toEqual([])
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fake.heartbeat.reconnects).toEqual([true])
  })

  it('pings as soon as the page becomes visible again', async () => {
    const fake = createFakeConnection()
    startHeartbeat(fake.conn)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(fake.heartbeat.pings).toBe(1)
  })

  it('does not ping when the page is hidden', () => {
    const fake = createFakeConnection()
    startHeartbeat(fake.conn)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(fake.heartbeat.pings).toBe(0)
  })

  it('pings as soon as the network comes back', () => {
    const fake = createFakeConnection()
    startHeartbeat(fake.conn)
    window.dispatchEvent(new Event('online'))
    expect(fake.heartbeat.pings).toBe(1)
  })

  it('stops pinging after the connection is closed', async () => {
    const fake = createFakeConnection()
    startHeartbeat(fake.conn)
    fake.conn.close()
    await vi.advanceTimersByTimeAsync(120_000)
    window.dispatchEvent(new Event('online'))
    expect(fake.heartbeat.pings).toBe(0)
  })

  it('stops pinging when stopped', async () => {
    const fake = createFakeConnection()
    const stop = startHeartbeat(fake.conn)
    stop()
    await vi.advanceTimersByTimeAsync(120_000)
    window.dispatchEvent(new Event('online'))
    expect(fake.heartbeat.pings).toBe(0)
  })

  it('does not reconnect when the pong arrives in time', async () => {
    const fake = createFakeConnection()
    startHeartbeat(fake.conn)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fake.heartbeat.reconnects).toEqual([])
  })
})
