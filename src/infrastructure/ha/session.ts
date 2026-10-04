import { ERR_INVALID_AUTH, subscribeEntities, type Connection } from 'home-assistant-js-websocket'
import { entityStore } from '../entities/entityStore'
import { startHeartbeat } from './heartbeat'
import { connectionStatus } from './connectionStatus'
import {
  describeError,
  ERR_KIOSK_TOKEN_REQUIRED,
  forgetCredentials,
  getConnection,
  isKioskDevice,
  resetAuth,
} from './connection'

const TOKEN_REJECTED = 'Home Assistant rejected that token.'

const CONNECTED = { kind: 'connected' } as const

// Connects and feeds the entity and status stores. Called from App's effect, never
// at import time, so a screen can render before any connection or OAuth starts.
// Returns the cleanup for the effect.
export function startSession(connect: () => Promise<Connection> = getConnection): () => void {
  connectionStatus.set({ kind: 'connecting' })
  let cancelled = false
  let cleanup: (() => void) | undefined
  // A kiosk has no one to log in, so a revoked token goes back to the token form.
  const onAuthLost = () => {
    if (!isKioskDevice()) return resetAuth()
    forgetCredentials()
    connectionStatus.set({ kind: 'needs-token', error: TOKEN_REJECTED })
  }
  const onDisconnected = () => connectionStatus.set({ kind: 'reconnecting' })

  connect().then(
    (conn) => {
      if (cancelled) return
      conn.addEventListener('disconnected', onDisconnected)
      // Fired only when the refresh token is rejected; the library stops retrying.
      conn.addEventListener('reconnect-error', onAuthLost)
      // Subscriptions are restored after a reconnect, and the entity collection
      // re-emits, which flips the status back to connected.
      const unsubscribe = subscribeEntities(conn, (entities) => {
        entityStore.setEntities(entities)
        // Fires on every state change in the house. A shared value, so the status store
        // only notifies (and re-renders the app) when the status really changes.
        connectionStatus.set(CONNECTED)
      })
      const stopHeartbeat = startHeartbeat(conn)
      cleanup = () => {
        stopHeartbeat()
        unsubscribe()
        conn.removeEventListener('disconnected', onDisconnected)
        conn.removeEventListener('reconnect-error', onAuthLost)
      }
    },
    (err) => {
      if (cancelled) return
      if (err === ERR_KIOSK_TOKEN_REQUIRED) connectionStatus.set({ kind: 'needs-token' })
      else if (err === ERR_INVALID_AUTH && isKioskDevice()) {
        connectionStatus.set({ kind: 'needs-token', error: TOKEN_REJECTED })
      } else connectionStatus.set({ kind: 'error', message: describeError(err) })
    },
  )

  return () => {
    cancelled = true
    cleanup?.()
  }
}
