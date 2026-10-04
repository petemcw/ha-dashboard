import { createConnection, subscribeEntities, type HassEntities } from 'home-assistant-js-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lightState } from '../../domains/light/factories'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createWebSocketGateway } from '../serviceGateway/serviceGateway'
import { FakeHa } from './fakeHa'
import { createDemoSocket } from './demoSocket'

beforeEach(setConnected)
afterEach(resetConnectionStatus)

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
})
