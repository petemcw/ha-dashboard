import { renderHook, waitFor } from '@testing-library/react'
import type { Connection } from 'home-assistant-js-websocket'
import { describe, expect, it } from 'vitest'
import { useCurrentUser } from './useCurrentUser'

const connectAs = (user: object) => () =>
  Promise.resolve({
    sendMessagePromise: (msg: { type: string }) =>
      msg.type === 'auth/current_user' ? Promise.resolve(user) : Promise.reject(new Error('?')),
  } as unknown as Connection)

describe('useCurrentUser', () => {
  it('is unknown until HA answers, then exposes id and isAdmin', async () => {
    const connect = connectAs({ id: 'u1', name: 'A', is_admin: true, is_owner: true })
    const { result } = renderHook(() => useCurrentUser(connect))
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toEqual({ id: 'u1', isAdmin: true }))
  })

  it('reports a non-admin user', async () => {
    const connect = connectAs({ id: 'u2', name: 'K', is_admin: false, is_owner: false })
    const { result } = renderHook(() => useCurrentUser(connect))
    await waitFor(() => expect(result.current).toEqual({ id: 'u2', isAdmin: false }))
  })

  it('stays unknown when the connection fails', async () => {
    const { result } = renderHook(() => useCurrentUser(() => Promise.reject(new Error('down'))))
    await new Promise((r) => setTimeout(r, 10))
    expect(result.current).toBeUndefined()
  })
})
