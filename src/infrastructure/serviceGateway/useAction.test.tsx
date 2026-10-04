import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { webSocketGateway } from './serviceGateway'
import { ServiceGatewayProvider, useServiceGateway } from './ServiceGatewayProvider'
import { useAction } from './useAction'
import { useControlsEnabled } from './useControlsEnabled'
import { ServiceCallError } from './serviceGateway'

afterEach(resetConnectionStatus)

describe('useControlsEnabled', () => {
  it('is true only while the connection status is connected', () => {
    const { result } = renderHook(() => useControlsEnabled())
    expect(result.current).toBe(false)
    act(() => setConnected())
    expect(result.current).toBe(true)
    act(() => resetConnectionStatus())
    expect(result.current).toBe(false)
  })
})

describe('useServiceGateway', () => {
  it('returns the WebSocket gateway when no provider is mounted', () => {
    const { result } = renderHook(() => useServiceGateway())
    expect(result.current).toBe(webSocketGateway)
  })

  it('returns the gateway the provider was given', () => {
    const fake = createFakeServiceGateway()
    const { result } = renderHook(() => useServiceGateway(), {
      wrapper: ({ children }) => (
        <ServiceGatewayProvider gateway={fake.gateway}>{children}</ServiceGatewayProvider>
      ),
    })
    expect(result.current).toBe(fake.gateway)
  })
})

describe('useAction', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const start = (clearKey?: unknown) => {
    const fake = createFakeServiceGateway()
    const hook = renderHook(({ k }) => useAction({ clearKey: k }), {
      initialProps: { k: clearKey },
      wrapper: ({ children }) => (
        <ServiceGatewayProvider gateway={fake.gateway}>{children}</ServiceGatewayProvider>
      ),
    })
    const run = () =>
      act(() => hook.result.current.run((gateway) => gateway.callService('light', 'turn_on')))
    return { fake, hook, run }
  }

  it('runs the action against the provided gateway', () => {
    const { fake, run } = start()
    run()
    expect(fake.calls).toEqual([
      { domain: 'light', service: 'turn_on', data: undefined, target: undefined },
    ])
  })

  it('is enabled only while the connection status is connected', () => {
    const { hook } = start()
    expect(hook.result.current.enabled).toBe(false)
    act(() => setConnected())
    expect(hook.result.current.enabled).toBe(true)
  })

  it('is pending from run until the action settles', async () => {
    const { fake, hook, run } = start()
    expect(hook.result.current.pending).toBe(false)
    run()
    expect(hook.result.current.pending).toBe(true)
    await act(async () => fake.resolve())
    expect(hook.result.current.pending).toBe(false)
    expect(hook.result.current.failure).toBeNull()
  })

  it('ignores a second run while the first is still in flight', () => {
    const { fake, run } = start()
    run()
    run()
    expect(fake.calls).toHaveLength(1)
  })

  it('marks failed when the action rejects and clears it on the next run', async () => {
    const { fake, hook, run } = start()
    run()
    await act(async () => fake.reject(new ServiceCallError('connection-lost')))
    expect(hook.result.current.failure).toBe('connection-lost')
    run()
    expect(hook.result.current.failure).toBeNull()
    await act(async () => fake.reject(new Error('boom')))
    expect(hook.result.current.failure).toBe('rejected')
  })

  it('clears the failure sixty seconds after it happened', async () => {
    const { fake, hook, run } = start()
    run()
    await act(async () => fake.reject(new ServiceCallError('rejected')))
    act(() => vi.advanceTimersByTime(59_000))
    expect(hook.result.current.failure).toBe('rejected')
    act(() => vi.advanceTimersByTime(1_000))
    expect(hook.result.current.failure).toBeNull()
  })

  it('clears the failure when the clear key changes', async () => {
    const { fake, hook, run } = start('on')
    run()
    await act(async () => fake.reject(new ServiceCallError('rejected')))
    expect(hook.result.current.failure).toBe('rejected')
    hook.rerender({ k: 'off' })
    expect(hook.result.current.failure).toBeNull()
  })
})
