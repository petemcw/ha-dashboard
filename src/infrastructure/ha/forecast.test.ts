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
})
