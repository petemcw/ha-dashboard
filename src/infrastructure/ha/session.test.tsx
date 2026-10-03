import { act, renderHook } from '@testing-library/react'
import { ERR_CANNOT_CONNECT, ERR_INVALID_AUTH } from 'home-assistant-js-websocket'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KIOSK_MODE_KEY, LONG_LIVED_TOKEN_KEY } from '../storageKeys'
import { ERR_KIOSK_TOKEN_REQUIRED } from './connection'
import { createFakeConnection } from '../../test/fakeConnection'
import { entityStore } from '../entities/entityStore'
import { connectionStatus } from './connectionStatus'
import { startSession } from './session'
import { useConnectionStatus } from './useConnectionStatus'

afterEach(() => {
  localStorage.clear()
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
})

describe('connection status', () => {
  it('reports reconnecting when the connection emits disconnected', async () => {
    const fake = createFakeConnection()
    startSession(() => Promise.resolve(fake.conn))
    await act(async () => {})
    const { result } = renderHook(() => useConnectionStatus())
    act(() => fake.emit([{ entity_id: 'light.kitchen', state: 'on' }]))
    expect(result.current.kind).toBe('connected')
    act(() => fake.dispatch('disconnected'))
    expect(result.current.kind).toBe('reconnecting')
  })

  it('reports connected again when entities are re-emitted after a reconnect', async () => {
    const fake = createFakeConnection()
    startSession(() => Promise.resolve(fake.conn))
    await act(async () => {})
    const { result } = renderHook(() => useConnectionStatus())
    act(() => fake.emit([{ entity_id: 'light.kitchen', state: 'on' }]))
    act(() => fake.dispatch('disconnected'))
    // The last map stays while reconnecting.
    expect(entityStore.get().entities['light.kitchen']).toBeDefined()
    act(() => fake.emit([{ entity_id: 'light.kitchen', state: 'off' }]))
    expect(result.current.kind).toBe('connected')
  })

  it('reports an error with a readable message when the first connection fails', async () => {
    startSession(() => Promise.reject(ERR_CANNOT_CONNECT))
    const { result } = renderHook(() => useConnectionStatus())
    await act(async () => {})
    expect(result.current).toEqual({ kind: 'error', message: "Can't reach Home Assistant." })
  })
})

describe('session heartbeat', () => {
  it('pings while the session runs and stops when it is cleaned up', async () => {
    const fake = createFakeConnection()
    const stop = startSession(() => Promise.resolve(fake.conn))
    await act(async () => {})
    window.dispatchEvent(new Event('online'))
    expect(fake.heartbeat.pings).toBe(1)
    stop()
    window.dispatchEvent(new Event('online'))
    expect(fake.heartbeat.pings).toBe(1)
  })
})

describe('kiosk token form', () => {
  it('asks for a token when a kiosk has none', async () => {
    startSession(() => Promise.reject(ERR_KIOSK_TOKEN_REQUIRED))
    await act(async () => {})
    expect(connectionStatus.get()).toEqual({ kind: 'needs-token' })
  })

  it('returns a kiosk to the form with an error when its token is rejected', async () => {
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    startSession(() => Promise.reject(ERR_INVALID_AUTH))
    await act(async () => {})
    expect(connectionStatus.get()).toEqual({
      kind: 'needs-token',
      error: 'Home Assistant rejected that token.',
    })
  })

  it('returns a kiosk to the form, not the login, when its token is rejected later', async () => {
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'revoked')
    const replace = vi.fn()
    vi.stubGlobal('location', { pathname: '/', search: '', replace })
    const fake = createFakeConnection()
    startSession(() => Promise.resolve(fake.conn))
    await act(async () => {})
    act(() => fake.dispatch('reconnect-error'))
    expect(connectionStatus.get()).toEqual({
      kind: 'needs-token',
      error: 'Home Assistant rejected that token.',
    })
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBeNull()
    expect(replace).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
