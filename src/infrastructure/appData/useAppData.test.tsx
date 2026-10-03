import { act, renderHook, waitFor } from '@testing-library/react'
import type { Connection } from 'home-assistant-js-websocket'
import { describe, expect, it, vi } from 'vitest'
import { useAppData } from './useAppData'

// A fake Connection at the library boundary: records the subscribe message and lets
// the test push `{value}` events the way HA does (once on subscribe, again after sets).
function fakeConn() {
  let push: (ev: { value: unknown }) => void = () => {}
  const unsubscribe = vi.fn()
  const subscribeMessage = vi.fn((cb: typeof push, _msg?: unknown) => {
    push = cb
    return Promise.resolve(unsubscribe)
  })
  const conn = { subscribeMessage } as unknown as Connection
  return {
    connect: () => Promise.resolve(conn),
    subscribeMessage,
    unsubscribe,
    emit: (v: unknown) => push({ value: v }),
  }
}

describe('useAppData', () => {
  it('is not loaded until the first value arrives, then reports it', async () => {
    const f = fakeConn()
    const { result } = renderHook(() => useAppData('user', 'k', f.connect))
    expect(result.current).toEqual({ value: null, loaded: false })
    await waitFor(() => expect(f.subscribeMessage).toHaveBeenCalled())
    act(() => f.emit({ a: 1 }))
    expect(result.current).toEqual({ value: { a: 1 }, loaded: true })
  })

  it.each([
    { scope: 'user', type: 'frontend/subscribe_user_data' },
    { scope: 'system', type: 'frontend/subscribe_system_data' },
  ] as const)(
    'subscribes to the given $scope key and follows later changes',
    async ({ scope, type }) => {
      const f = fakeConn()
      const { result } = renderHook(() => useAppData(scope, 'ha-dashboard:favorites', f.connect))
      await waitFor(() => expect(f.subscribeMessage).toHaveBeenCalled())
      expect(f.subscribeMessage.mock.calls[0][1]).toEqual({ type, key: 'ha-dashboard:favorites' })
      act(() => f.emit(null))
      expect(result.current).toEqual({ value: null, loaded: true })
      act(() => f.emit('x'))
      expect(result.current.value).toBe('x')
    },
  )

  it('unsubscribes on unmount', async () => {
    const f = fakeConn()
    const { unmount } = renderHook(() => useAppData('system', 'k', f.connect))
    await waitFor(() => expect(f.subscribeMessage).toHaveBeenCalled())
    unmount()
    await waitFor(() => expect(f.unsubscribe).toHaveBeenCalled())
  })

  it('stays unloaded when the connection fails', async () => {
    const { result } = renderHook(() =>
      useAppData('user', 'k', () => Promise.reject(new Error('x'))),
    )
    await Promise.resolve()
    expect(result.current.loaded).toBe(false)
  })
})
