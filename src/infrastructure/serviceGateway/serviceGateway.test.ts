import { afterEach, describe, expect, it } from 'vitest'
import { createFakeConnection } from '../../test/fakeConnection'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createWebSocketGateway, ServiceCallError } from './serviceGateway'

afterEach(resetConnectionStatus)

function setup() {
  const fake = createFakeConnection()
  return { fake, gateway: createWebSocketGateway(() => Promise.resolve(fake.conn)) }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('web socket service gateway', () => {
  it('sends call_service with the domain, service, data, and target through the connection', async () => {
    setConnected()
    const { fake, gateway } = setup()
    const done = gateway.callService(
      'light',
      'turn_on',
      { brightness: 10 },
      { entity_id: 'light.a' },
    )
    await flush()
    expect(fake.sent()).toEqual([
      {
        type: 'call_service',
        domain: 'light',
        service: 'turn_on',
        service_data: { brightness: 10 },
        target: { entity_id: 'light.a' },
      },
    ])
    fake.resolveSent(0)
    await expect(done).resolves.toBeUndefined()
  })

  it('rejects without sending anything when the connection status is not connected', async () => {
    const { fake, gateway } = setup()
    await expect(gateway.callService('light', 'turn_on')).rejects.toMatchObject({
      kind: 'rejected',
    })
    expect(fake.sent()).toEqual([])
  })

  it('rejects with a rejected error when HA answers with an error result', async () => {
    setConnected()
    const { fake, gateway } = setup()
    const done = gateway.callService('light', 'turn_on')
    await flush()
    fake.rejectSent(0, {
      type: 'result',
      success: false,
      error: { code: 'not_found', message: 'x' },
    })
    const err = await done.catch((e) => e)
    expect(err).toBeInstanceOf(ServiceCallError)
    expect(err.kind).toBe('rejected')
  })

  it('rejects with a connection-lost error when the socket closes while the call is in flight', async () => {
    setConnected()
    const { fake, gateway } = setup()
    const done = gateway.callService('light', 'turn_on')
    await flush()
    fake.rejectSent(0, { type: 'result', success: false, error: { code: 3, message: 'lost' } })
    await expect(done).rejects.toMatchObject({ kind: 'connection-lost' })

    const second = gateway.callService('light', 'turn_on')
    await flush()
    fake.rejectSent(1, 3)
    await expect(second).rejects.toMatchObject({ kind: 'connection-lost' })
  })
})
