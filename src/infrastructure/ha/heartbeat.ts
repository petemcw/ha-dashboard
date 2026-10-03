import type { Connection } from 'home-assistant-js-websocket'

const PING_INTERVAL_MS = 30_000
const PONG_TIMEOUT_MS = 10_000

// The library never pings, and a half-open socket (Wi-Fi change, a suspended phone) can
// go minutes without a close event, so `disconnected` never fires. Ping ourselves and
// force a reconnect when HA stops answering. Returns the stop function.
export function startHeartbeat(conn: Connection): () => void {
  let pongTimer: ReturnType<typeof setTimeout> | undefined

  const check = () => {
    // Closed for good: nothing left to keep alive. Also covers a stop we never heard of.
    if (conn.closeRequested) return stop()
    // A ping is already waiting for its pong.
    if (pongTimer !== undefined) return
    pongTimer = setTimeout(() => {
      pongTimer = undefined
      // `true` closes the dead socket even though it never reported an error.
      conn.reconnect(true)
    }, PONG_TIMEOUT_MS)
    conn.ping().then(
      () => {
        clearTimeout(pongTimer)
        pongTimer = undefined
      },
      // The ping failed outright (socket already closing); the library is reconnecting.
      () => {},
    )
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') check()
  }

  const interval = setInterval(check, PING_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('online', check)

  function stop() {
    clearInterval(interval)
    clearTimeout(pongTimer)
    pongTimer = undefined
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('online', check)
  }
  return stop
}
