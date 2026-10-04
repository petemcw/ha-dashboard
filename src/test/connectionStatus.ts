import { connectionStatus } from '../infrastructure/ha/connectionStatus'

// connectionStatus is a module singleton that starts as `connecting`, so every control
// is disabled until a test says the connection is up. Reset it in afterEach.
export function setConnected() {
  connectionStatus.set({ kind: 'connected' })
}

export function resetConnectionStatus() {
  connectionStatus.set({ kind: 'connecting' })
}
