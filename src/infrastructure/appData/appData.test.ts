import type { Connection } from 'home-assistant-js-websocket'
import { describe, expect, it, vi } from 'vitest'
import { setAppData, subscribeAppData } from './appData'

describe.each([
  { scope: 'user', subscribe: 'frontend/subscribe_user_data', set: 'frontend/set_user_data' },
  { scope: 'system', subscribe: 'frontend/subscribe_system_data', set: 'frontend/set_system_data' },
] as const)('$scope app data', ({ scope, subscribe, set }) => {
  it('subscribes to the key and reports each value', async () => {
    let push: (ev: { value: unknown }) => void = () => {}
    const subscribeMessage = vi.fn((cb: typeof push) => {
      push = cb
      return Promise.resolve(() => {})
    })
    const seen: unknown[] = []
    await subscribeAppData({ subscribeMessage } as unknown as Connection, scope, 'k', (v) =>
      seen.push(v),
    )
    push({ value: 1 })
    push({ value: null })
    expect(subscribeMessage.mock.calls[0]).toEqual([
      expect.any(Function),
      { type: subscribe, key: 'k' },
    ])
    expect(seen).toEqual([1, null])
  })

  it(`writes through ${set}`, async () => {
    const sendMessagePromise = vi.fn(() => Promise.resolve())
    await setAppData(scope, 'k', { a: 1 }, () =>
      Promise.resolve({ sendMessagePromise } as unknown as Connection),
    )
    expect(sendMessagePromise).toHaveBeenCalledWith({ type: set, key: 'k', value: { a: 1 } })
  })
})

describe('setAppData', () => {
  it('rejects when HA refuses the write', async () => {
    const conn = { sendMessagePromise: () => Promise.reject({ code: 'unauthorized' }) }
    await expect(
      setAppData('system', 'k', 1, () => Promise.resolve(conn as unknown as Connection)),
    ).rejects.toEqual({ code: 'unauthorized' })
  })
})
