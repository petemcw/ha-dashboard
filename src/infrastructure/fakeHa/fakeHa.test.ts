import { afterEach, describe, expect, it, vi } from 'vitest'
import { entityState } from '../../domains/factories.ts'
import { FakeHa, type ClientMessage } from './fakeHa.ts'

type Msg = Record<string, unknown>

function setup(options: ConstructorParameters<typeof FakeHa>[0] = {}) {
  const ha = new FakeHa(options)
  const connect = () => {
    const received: Msg[] = []
    const client = ha.connect((m) => received.push(m as Msg))
    return { client, received }
  }
  return { ha, connect }
}

const light = entityState({ entity_id: 'light.lamp', state: 'off' })
const toggleSwitch = entityState({ entity_id: 'switch.plug', state: 'on' })
const scene = entityState({ entity_id: 'scene.movie', state: 'unknown' })

const callService = (
  id: number,
  domain: string,
  service: string,
  entity_id: string | string[],
): ClientMessage => ({ id, type: 'call_service', domain, service, target: { entity_id } })

const resultOf = (received: Msg[], id: number) =>
  received.find((m) => m.type === 'result' && m.id === id)

describe('FakeHa call_service', () => {
  it('turns a light on when it receives light.turn_on for that entity', () => {
    const { ha, connect } = setup({ entities: [light] })
    const { client, received } = connect()
    ha.receive(client, { id: 1, type: 'subscribe_entities' })
    ha.receive(client, callService(2, 'light', 'turn_on', 'light.lamp'))
    expect(ha.getState('light.lamp')?.state).toBe('on')
    expect(resultOf(received, 2)).toMatchObject({ success: true })
  })

  it('flips a switch when it receives switch.toggle', () => {
    const { ha, connect } = setup({ entities: [toggleSwitch] })
    const { client } = connect()
    ha.receive(client, callService(1, 'switch', 'toggle', 'switch.plug'))
    expect(ha.getState('switch.plug')?.state).toBe('off')
    ha.receive(client, callService(2, 'switch', 'toggle', 'switch.plug'))
    expect(ha.getState('switch.plug')?.state).toBe('on')
  })

  it('broadcasts the changed entity to every subscribe_entities client', () => {
    const { ha, connect } = setup({ entities: [light] })
    const a = connect()
    const b = connect()
    ha.receive(a.client, { id: 1, type: 'subscribe_entities' })
    ha.receive(b.client, { id: 7, type: 'subscribe_entities' })
    ha.receive(a.client, callService(2, 'light', 'turn_on', 'light.lamp'))
    const event = (r: Msg[], id: number) => r.find((m) => m.type === 'event' && m.id === id)
    for (const [c, id] of [
      [a, 1],
      [b, 7],
    ] as const) {
      const ev = event(c.received.slice(2), id) as { event: { c: Record<string, unknown> } }
      expect(ev.event.c['light.lamp']).toMatchObject({ '+': { s: 'on' } })
    }
  })

  it("sets a scene's state to the activation time on scene.turn_on", () => {
    const { ha, connect } = setup({ entities: [scene] })
    const { client } = connect()
    const before = Date.now()
    ha.receive(client, callService(1, 'scene', 'turn_on', 'scene.movie'))
    const stamped = Date.parse(ha.getState('scene.movie')!.state)
    expect(stamped).toBeGreaterThanOrEqual(before)
    expect(stamped).toBeLessThanOrEqual(Date.now())
  })

  it("answers not_found when call_service targets an entity it doesn't have", () => {
    const { ha, connect } = setup()
    const { client, received } = connect()
    ha.receive(client, callService(1, 'light', 'turn_on', 'light.ghost'))
    expect(resultOf(received, 1)).toMatchObject({ success: false, error: { code: 'not_found' } })
  })

  it('answers with an error for an HA action listed in failServices', () => {
    const { ha, connect } = setup({ entities: [toggleSwitch], failServices: ['switch.turn_off'] })
    const { client, received } = connect()
    ha.receive(client, callService(1, 'switch', 'turn_off', 'switch.plug'))
    expect(resultOf(received, 1)).toMatchObject({ success: false })
    expect(ha.getState('switch.plug')?.state).toBe('on')
  })

  it('records every call_service message it receives', () => {
    const { ha, connect } = setup({ entities: [light], failServices: ['light.turn_off'] })
    const { client } = connect()
    ha.receive(client, callService(1, 'light', 'turn_on', 'light.lamp'))
    ha.receive(client, callService(2, 'light', 'turn_off', 'light.lamp'))
    ha.receive(client, callService(3, 'light', 'turn_on', 'light.ghost'))
    expect(ha.sent().map((m) => m.id)).toEqual([1, 2, 3])
  })

  it('applies a call to every entity in a target entity_id list', () => {
    const other = entityState({ entity_id: 'light.desk', state: 'off' })
    const { ha, connect } = setup({ entities: [light, other] })
    const { client } = connect()
    ha.receive(client, callService(1, 'light', 'turn_on', ['light.lamp', 'light.desk']))
    expect(ha.getState('light.lamp')?.state).toBe('on')
    expect(ha.getState('light.desk')?.state).toBe('on')
  })

  it('falls back to service_data.entity_id when there is no target', () => {
    const { ha, connect } = setup({ entities: [light] })
    const { client } = connect()
    ha.receive(client, {
      id: 1,
      type: 'call_service',
      domain: 'light',
      service: 'turn_on',
      service_data: { entity_id: 'light.lamp' },
    })
    expect(ha.getState('light.lamp')?.state).toBe('on')
  })

  it('only bumps last_updated when the state value does not change', () => {
    const on = entityState({ entity_id: 'light.lamp', state: 'on', last_changed: 1_000 })
    const { ha, connect } = setup({ entities: [on] })
    const { client } = connect()
    ha.receive(client, callService(1, 'light', 'turn_on', 'light.lamp'))
    const after = ha.getState('light.lamp')!
    expect(after.last_changed).toBe(on.last_changed)
    expect(after.last_updated).not.toBe(on.last_updated)
  })

  it('sends the state change before the call_service result', () => {
    const { ha, connect } = setup({ entities: [light] })
    const { client, received } = connect()
    ha.receive(client, { id: 1, type: 'subscribe_entities' })
    const mark = received.length
    ha.receive(client, callService(2, 'light', 'turn_on', 'light.lamp'))
    const types = received.slice(mark).map((m) => m.type)
    expect(types).toEqual(['event', 'result'])
  })

  it('stops sending to a client after it disconnects', () => {
    const { ha, connect } = setup({ entities: [light] })
    const a = connect()
    const b = connect()
    ha.receive(a.client, { id: 1, type: 'subscribe_entities' })
    ha.receive(b.client, { id: 1, type: 'subscribe_entities' })
    ha.disconnect(a.client)
    const mark = a.received.length
    ha.receive(b.client, callService(2, 'light', 'turn_on', 'light.lamp'))
    expect(a.received.length).toBe(mark)
  })
})

describe('FakeHa responseDelayMs', () => {
  afterEach(() => vi.useRealTimers())

  it('delays the call_service result by the configured delay', () => {
    vi.useFakeTimers()
    const { ha, connect } = setup({ entities: [light], responseDelayMs: 600 })
    const { client, received } = connect()
    ha.receive(client, { id: 1, type: 'subscribe_entities' })
    ha.receive(client, callService(2, 'light', 'turn_on', 'light.lamp'))
    vi.advanceTimersByTime(599)
    expect(resultOf(received, 2)).toBeUndefined()
    expect(ha.getState('light.lamp')?.state).toBe('off')
    vi.advanceTimersByTime(1)
    expect(ha.getState('light.lamp')?.state).toBe('on')
    expect(resultOf(received, 2)).toMatchObject({ success: true })
    const types = received.map((m) => (m.type === 'event' ? 'event' : m.type))
    expect(types.lastIndexOf('event')).toBeLessThan(types.indexOf('result', 2))
  })
})

describe('FakeHa weather forecasts', () => {
  const hourly = [{ datetime: '2026-10-04T14:00:00+00:00', condition: 'sunny', temperature: 52 }]
  const weather = entityState({ entity_id: 'weather.forecast_home', state: 'sunny' })
  const subscribe = (id: number, entity_id: string, forecast_type: string): ClientMessage => ({
    id,
    type: 'weather/subscribe_forecast',
    entity_id,
    forecast_type,
  })

  it('answers a forecast subscription with the configured forecast in the fake HA', () => {
    const { ha, connect } = setup({
      entities: [weather],
      forecasts: { 'weather.forecast_home': { hourly } },
    })
    const { client, received } = connect()
    ha.receive(client, subscribe(1, 'weather.forecast_home', 'hourly'))
    expect(resultOf(received, 1)).toMatchObject({ success: true, result: null })
    expect(received.find((m) => m.type === 'event')).toEqual({
      id: 1,
      type: 'event',
      event: { type: 'hourly', forecast: hourly },
    })
  })

  it('pushes a forecast update to subscribers in the fake HA', () => {
    const { ha, connect } = setup({
      entities: [weather],
      forecasts: { 'weather.forecast_home': { hourly } },
    })
    const { client, received } = connect()
    ha.receive(client, subscribe(1, 'weather.forecast_home', 'hourly'))
    const next = [{ ...hourly[0], temperature: 60 }]
    ha.setForecast('weather.forecast_home', 'hourly', next)
    expect(received.at(-1)).toEqual({
      id: 1,
      type: 'event',
      event: { type: 'hourly', forecast: next },
    })
    ha.receive(client, { id: 2, type: 'unsubscribe_events', subscription: 1 })
    const count = received.length
    ha.setForecast('weather.forecast_home', 'hourly', hourly)
    expect(received).toHaveLength(count)
  })

  it('rejects a forecast subscription for an entity without that forecast type like HA does', () => {
    const { ha, connect } = setup({
      entities: [weather],
      forecasts: { 'weather.forecast_home': { hourly } },
    })
    const { client, received } = connect()
    ha.receive(client, subscribe(1, 'weather.forecast_home', 'daily'))
    expect(resultOf(received, 1)).toMatchObject({
      success: false,
      error: { code: 'forecast_not_supported' },
    })
    ha.receive(client, subscribe(2, 'weather.missing', 'hourly'))
    expect(resultOf(received, 2)).toMatchObject({
      success: false,
      error: { code: 'invalid_entity_id' },
    })
  })
})
