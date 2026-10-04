import type { Connection } from 'home-assistant-js-websocket'
import { describe, expect, it, vi } from 'vitest'
import { subscribeForecast, type ForecastEntry } from './forecast'

// A Connection whose subscribeMessage records the command and lets the test push events.
function fakeSubscribable() {
  const state = {
    commands: [] as Record<string, unknown>[],
    push: (_event: unknown) => {},
    unsubscribe: vi.fn(),
  }
  const conn = {
    subscribeMessage: (cb: (ev: unknown) => void, command: Record<string, unknown>) => {
      state.commands.push(command)
      state.push = cb
      return Promise.resolve(state.unsubscribe)
    },
  } as unknown as Connection
  return { conn, state }
}

const entry = (datetime: string, temperature: number): ForecastEntry => ({
  datetime,
  condition: 'sunny',
  temperature,
})

describe('subscribeForecast', () => {
  it('subscribes to the hourly forecast for a weather entity', () => {
    const { conn, state } = fakeSubscribable()
    void subscribeForecast(conn, 'weather.forecast_home', 'hourly', () => {})
    expect(state.commands).toEqual([
      {
        type: 'weather/subscribe_forecast',
        entity_id: 'weather.forecast_home',
        forecast_type: 'hourly',
      },
    ])
  })

  it('delivers each forecast the subscription pushes', () => {
    const { conn, state } = fakeSubscribable()
    const onForecast = vi.fn()
    void subscribeForecast(conn, 'weather.forecast_home', 'hourly', onForecast)
    const first = [entry('2026-10-04T14:00:00+00:00', 52)]
    const second = [entry('2026-10-04T15:00:00+00:00', 55)]
    state.push({ type: 'hourly', forecast: first })
    state.push({ type: 'hourly', forecast: second })
    expect(onForecast.mock.calls).toEqual([[first], [second]])
  })

  it('keeps the last good forecast when an event has no forecast', () => {
    const { conn, state } = fakeSubscribable()
    const onForecast = vi.fn()
    void subscribeForecast(conn, 'weather.forecast_home', 'daily', onForecast)
    state.push({ type: 'daily', forecast: null })
    state.push({ type: 'daily', forecast: 'soon' })
    state.push(undefined)
    expect(onForecast).not.toHaveBeenCalled()
  })

  it('drops forecast entries with a wrong-typed field and keeps the well-formed ones', () => {
    const { conn, state } = fakeSubscribable()
    const onForecast = vi.fn()
    void subscribeForecast(conn, 'weather.forecast_home', 'daily', onForecast)
    const good = { datetime: '2026-10-04T17:00:00+00:00', condition: 'rainy', temperature: 61 }
    state.push({
      type: 'daily',
      forecast: [
        null,
        'sunny',
        { condition: 'sunny', temperature: 50 },
        { datetime: 1759597200, condition: 'sunny' },
        { datetime: '2026-10-05T17:00:00+00:00', condition: 7, temperature: 62 },
        { datetime: '2026-10-06T17:00:00+00:00', condition: 'sunny', temperature: '63' },
        { datetime: '2026-10-07T17:00:00+00:00', condition: 'sunny', templow: Number.NaN },
        {
          datetime: '2026-10-08T17:00:00+00:00',
          condition: 'sunny',
          precipitation_probability: {},
        },
        good,
      ],
    })
    expect(onForecast).toHaveBeenCalledWith([good])
  })

  it('treats null fields as absent, as HA sends for values a provider lacks', () => {
    const { conn, state } = fakeSubscribable()
    const onForecast = vi.fn()
    void subscribeForecast(conn, 'weather.forecast_home', 'hourly', onForecast)
    state.push({
      type: 'hourly',
      forecast: [{ datetime: '2026-10-04T15:00:00+00:00', condition: null, temperature: null }],
    })
    expect(onForecast).toHaveBeenCalledWith([{ datetime: '2026-10-04T15:00:00+00:00' }])
  })
})
