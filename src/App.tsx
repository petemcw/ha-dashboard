import { useEffect, useState } from 'react'
import { subscribeEntities, type UnsubscribeFunc } from 'home-assistant-js-websocket'
import { describeError, getConnection, resetAuth } from './ha'

type Status =
  | { kind: 'connecting' }
  | { kind: 'connected'; haVersion: string; entityCount: number }
  | { kind: 'reconnecting' }
  | { kind: 'error'; message: string }

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: 'connecting' })

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined
    const onDisconnected = () => setStatus({ kind: 'reconnecting' })

    getConnection().then(
      (conn) => {
        if (cancelled) return
        conn.addEventListener('disconnected', onDisconnected)
        // Fired only when the refresh token is rejected; the library stops retrying.
        conn.addEventListener('reconnect-error', resetAuth)
        // Subscriptions are restored after a reconnect, and the entity
        // collection re-emits, which flips the status back to connected.
        const unsubscribe: UnsubscribeFunc = subscribeEntities(conn, (entities) =>
          setStatus({
            kind: 'connected',
            haVersion: conn.haVersion,
            entityCount: Object.keys(entities).length,
          }),
        )
        cleanup = () => {
          unsubscribe()
          conn.removeEventListener('disconnected', onDisconnected)
          conn.removeEventListener('reconnect-error', resetAuth)
        }
      },
      (err) => {
        if (!cancelled) setStatus({ kind: 'error', message: describeError(err) })
      },
    )

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <main className="status">
      {status.kind === 'connecting' && <p>Connecting to Home Assistant…</p>}
      {status.kind === 'reconnecting' && <p>Connection lost. Reconnecting…</p>}
      {status.kind === 'connected' && (
        <p>
          Connected to Home Assistant {status.haVersion}
          <br />
          {status.entityCount} entities
        </p>
      )}
      {status.kind === 'error' && <p role="alert">{status.message}</p>}
    </main>
  )
}
