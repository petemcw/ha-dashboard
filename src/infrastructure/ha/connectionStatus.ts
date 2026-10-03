import { createStore } from '../store'

export type ConnectionStatus =
  | { kind: 'connecting'; retrying?: boolean }
  | { kind: 'connected' }
  | { kind: 'reconnecting' }
  // A kiosk with no usable token: show the token form, with an error if one was rejected.
  | { kind: 'needs-token'; error?: string }
  | { kind: 'error'; message: string }

export const connectionStatus = createStore<ConnectionStatus>({ kind: 'connecting' })
