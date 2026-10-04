import { createConnection, subscribeEntities, type HassEntities } from 'home-assistant-js-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lightState } from '../../domains/light/factories'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createWebSocketGateway } from '../serviceGateway/serviceGateway'
import { FakeHa } from './fakeHa'
import { createDemoSocket } from './demoSocket'

beforeEach(setConnected)
afterEach(() => {
  resetConnectionStatus()
  vi.useRealTimers()
})

describe('demo socket', () => {
  it('runs createConnection, subscribeEntities, and the WebSocket gateway’s callService over the demo socket', async () => {
    const ha = new FakeHa({ entities: [lightState({ entity_id: 'light.lamp', state: 'off' })] })
    const conn = await createConnection({ createSocket: createDemoSocket(ha) })
    const seen: HassEntities[] = []
    subscribeEntities(conn, (entities) => seen.push(entities))
    await vi.waitFor(() => expect(seen.at(-1)?.['light.lamp'].state).toBe('off'))

    await createWebSocketGateway(async () => conn).callService(
      'light',
      'turn_on',
      {},
      { entity_id: 'light.lamp' },
    )
    await vi.waitFor(() => expect(seen.at(-1)?.['light.lamp'].state).toBe('on'))
    conn.close()
  })

  it('reconnects over a new demo socket after a forced reconnect and resumes subscribe_entities', async () => {
    const ha = new FakeHa({ entities: [lightState({ entity_id: 'light.lamp', state: 'off' })] })
    const createSocket = vi.fn(createDemoSocket(ha))
    const conn = await createConnection({ createSocket })
    const seen: HassEntities[] = []
    subscribeEntities(conn, (entities) => seen.push(entities))
    await vi.waitFor(() => expect(seen).toHaveLength(1))

    conn.reconnect(true)
    await vi.waitFor(() => expect(createSocket).toHaveBeenCalledTimes(2))
    ha.setState(lightState({ entity_id: 'light.lamp', state: 'on' }))
    await vi.waitFor(() => expect(seen.at(-1)?.['light.lamp'].state).toBe('on'))
    expect(ha.sent().filter((m) => m.type === 'subscribe_entities')).toHaveLength(2)
    conn.close()
  })

  it('delivers nothing more once closed, and fires close only once', async () => {
    vi.useFakeTimers()
    const ha = new FakeHa()
    const socket = await createDemoSocket(ha)({} as never)
    const messages: unknown[] = []
    const closes: unknown[] = []
    socket.addEventListener('message', (e) => messages.push(e))
    socket.addEventListener('close', (e) => closes.push(e))
    socket.send(JSON.stringify({ id: 1, type: 'ping' }))
    vi.runAllTimers()
    expect(messages).toHaveLength(1)

    // The fake HA has answered the second ping, but the answer is still on its way.
    socket.send(JSON.stringify({ id: 2, type: 'ping' }))
    vi.advanceTimersToNextTimer()
    expect(ha.sent()).toHaveLength(2)
    socket.close()
    // A message sent after close never reaches the fake HA.
    socket.send(JSON.stringify({ id: 3, type: 'ping' }))
    socket.close()
    vi.runAllTimers()
    expect(messages).toHaveLength(1)
    expect(closes).toHaveLength(1)
    expect(ha.sent().map((m) => m.id)).toEqual([1, 2])
  })

  it('stops calling a listener once it is removed', async () => {
    const ha = new FakeHa()
    const socket = await createDemoSocket(ha)({} as never)
    const heard: unknown[] = []
    const listener = (e: unknown) => heard.push(e)
    socket.addEventListener('message', listener)
    socket.removeEventListener('message', listener)
    socket.send(JSON.stringify({ id: 1, type: 'ping' }))
    await vi.waitFor(() => expect(ha.sent()).toHaveLength(1))
    await new Promise((r) => setTimeout(r, 10))
    expect(heard).toEqual([])
  })
})
