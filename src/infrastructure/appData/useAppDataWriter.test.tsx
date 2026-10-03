import { act, renderHook } from '@testing-library/react'
import type { Connection } from 'home-assistant-js-websocket'
import { describe, expect, it } from 'vitest'
import { useAppDataWriter } from './useAppDataWriter'

// A fake Connection at the library boundary whose writes stay in flight until settled.
function fakeConn() {
  const sent: unknown[] = []
  let settle: (ok: boolean) => void = () => {}
  const conn = {
    sendMessagePromise: (msg: unknown) => {
      sent.push(msg)
      return new Promise<void>((resolve, reject) => {
        settle = (ok) => (ok ? resolve() : reject({ code: 'unauthorized' }))
      })
    },
  } as unknown as Connection
  return {
    connect: () => Promise.resolve(conn),
    sent,
    settle: (ok: boolean) => act(async () => settle(ok)),
  }
}

const flush = () => act(() => Promise.resolve())

describe('useAppDataWriter', () => {
  it('writes the change applied to the latest value', async () => {
    const f = fakeConn()
    const { result, rerender } = renderHook(
      ({ current }) => useAppDataWriter('user', 'k', current, true, f.connect),
      { initialProps: { current: [1] } },
    )
    rerender({ current: [1, 2] })
    act(() => result.current.write((v) => [...v, 3]))
    await flush()
    expect(f.sent).toEqual([{ type: 'frontend/set_user_data', key: 'k', value: [1, 2, 3] }])
    expect(result.current.pending).toBe(true)
    await f.settle(true)
    expect(result.current).toMatchObject({ pending: false, failed: false })
  })

  it('drops a second write while the first is in flight', async () => {
    const f = fakeConn()
    const { result } = renderHook(() => useAppDataWriter('user', 'k', 0, true, f.connect))
    act(() => {
      result.current.write(() => 1)
      result.current.write(() => 2)
    })
    await flush()
    expect(f.sent).toHaveLength(1)
  })

  it('never writes when the caller does not allow it', async () => {
    const f = fakeConn()
    const { result } = renderHook(() => useAppDataWriter('system', 'k', 0, false, f.connect))
    act(() => result.current.write(() => 1))
    await flush()
    expect(f.sent).toEqual([])
    expect(result.current.pending).toBe(false)
  })

  it('reports a rejected write and clears it on the next attempt', async () => {
    const f = fakeConn()
    const { result } = renderHook(() => useAppDataWriter('system', 'k', 0, true, f.connect))
    act(() => result.current.write(() => 1))
    await flush()
    await f.settle(false)
    expect(result.current).toMatchObject({ pending: false, failed: true })
    act(() => result.current.write(() => 2))
    expect(result.current.failed).toBe(false)
  })
})
