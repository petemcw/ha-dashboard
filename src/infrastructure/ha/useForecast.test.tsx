import { renderHook, waitFor } from '@testing-library/react'
import type { Connection } from 'home-assistant-js-websocket'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useForecast } from './useForecast'

function setup() {
  const state = { push: (_e: unknown) => {}, unsubscribe: vi.fn(), subscribed: 0 }
  const conn = {
    subscribeMessage: (cb: (ev: unknown) => void) => {
      state.push = cb
      state.subscribed++
      return Promise.resolve(state.unsubscribe)
    },
  } as unknown as Connection
  return { state, connect: () => Promise.resolve(conn) }
}

const forecast = [{ datetime: '2026-10-04T14:00:00+00:00', condition: 'sunny', temperature: 52 }]

describe('useForecast', () => {
  it('is undefined until the first forecast arrives, then holds the last good one', async () => {
    const { state, connect } = setup()
    const { result } = renderHook(() => useForecast('weather.forecast_home', 'hourly', connect))
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(state.subscribed).toBe(1))
    act(() => state.push({ type: 'hourly', forecast }))
    expect(result.current).toEqual(forecast)
    act(() => state.push({ type: 'hourly', forecast: null }))
    expect(result.current).toEqual(forecast)
  })

  it('unsubscribes from the forecast when the card unmounts', async () => {
    const { state, connect } = setup()
    const { unmount } = renderHook(() => useForecast('weather.forecast_home', 'hourly', connect))
    await waitFor(() => expect(state.subscribed).toBe(1))
    unmount()
    await waitFor(() => expect(state.unsubscribe).toHaveBeenCalledTimes(1))
  })

  it('stays undefined when HA rejects the subscription', async () => {
    const conn = { subscribeMessage: () => Promise.reject({ code: 'invalid_entity_id' }) }
    const { result } = renderHook(() =>
      useForecast('weather.nope', 'daily', () => Promise.resolve(conn as unknown as Connection)),
    )
    await new Promise((r) => setTimeout(r, 10))
    expect(result.current).toBeUndefined()
  })
})
