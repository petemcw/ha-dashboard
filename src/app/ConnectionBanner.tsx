import type { ConnectionStatus } from '../infrastructure/ha/connectionStatus'

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  if (status.kind === 'reconnecting') {
    return (
      <p className="banner banner--warn" role="status">
        Connection lost. Reconnecting…
      </p>
    )
  }
  if (status.kind === 'connecting' && status.retrying) {
    // A status, not an alert: this repeats every second until HA is back.
    return (
      <p className="banner banner--warn" role="status">
        Can’t reach Home Assistant. Retrying…
      </p>
    )
  }
  if (status.kind === 'error') {
    return (
      <p className="banner banner--danger" role="alert">
        {status.message}
      </p>
    )
  }
  return null
}
