import { ERR_INVALID_AUTH } from 'home-assistant-js-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LONG_LIVED_TOKEN_KEY } from '../storageKeys'

// A scripted WebSocket: each new socket follows the next script entry, speaking
// just enough of HA's protocol for the real library to connect or reject auth.
type Script = 'unreachable' | 'ok' | 'auth_invalid'
let scripts: Script[] = []
let opened = 0

class FakeWebSocket extends EventTarget {
  readonly OPEN = 1
  readyState = 0
  private script: Script
  constructor() {
    super()
    this.script = scripts.shift() ?? 'ok'
    opened++
    queueMicrotask(() => {
      if (this.script === 'unreachable') return this.close()
      this.readyState = 1
      this.dispatchEvent(new Event('open'))
      this.reply({ type: 'auth_required', ha_version: '2026.9.4' })
    })
  }
  send(raw: string) {
    if (JSON.parse(raw).type !== 'auth') return
    this.reply(
      this.script === 'auth_invalid'
        ? { type: 'auth_invalid', message: 'bad' }
        : { type: 'auth_ok', ha_version: '2026.9.4' },
    )
  }
  close() {
    this.readyState = 3
    queueMicrotask(() => this.dispatchEvent(new Event('close')))
  }
  private reply(msg: unknown) {
    queueMicrotask(() =>
      this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(msg) })),
    )
  }
}

async function freshConnection() {
  vi.resetModules()
  const [connection, status] = await Promise.all([
    import('./connection'),
    import('./connectionStatus'),
  ])
  return { ...connection, connectionStatus: status.connectionStatus }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv('VITE_HA_URL', 'https://ha.example')
  vi.stubGlobal('WebSocket', FakeWebSocket)
  vi.stubGlobal('location', { pathname: '/', search: '', replace: vi.fn() })
  localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'tok')
  opened = 0
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  localStorage.clear()
})

describe('startup retry', () => {
  it('keeps retrying when Home Assistant is unreachable at startup and connects once it is back', async () => {
    scripts = ['unreachable', 'unreachable', 'ok']
    const { getConnection } = await freshConnection()
    const pending = getConnection()
    await vi.advanceTimersByTimeAsync(5_000)
    const conn = await pending
    expect(conn.connected).toBe(true)
    expect(opened).toBe(3)
  })

  it('says it is retrying while Home Assistant is unreachable', async () => {
    scripts = ['unreachable', 'ok']
    const { getConnection, connectionStatus } = await freshConnection()
    const pending = getConnection()
    await vi.advanceTimersByTimeAsync(10)
    expect(connectionStatus.get()).toEqual({ kind: 'connecting', retrying: true })
    await vi.advanceTimersByTimeAsync(2_000)
    await pending
  })

  it('still reports an error at once when Home Assistant rejects the credentials at startup', async () => {
    scripts = ['auth_invalid']
    const { getConnection } = await freshConnection()
    const pending = getConnection()
    const settled = expect(pending).rejects.toBe(ERR_INVALID_AUTH)
    await vi.advanceTimersByTimeAsync(10)
    await settled
    expect(opened).toBe(1)
  })
})
