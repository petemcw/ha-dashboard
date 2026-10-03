import { useSyncExternalStore } from 'react'
import { connectionStatus, type ConnectionStatus } from './connectionStatus'

export function useConnectionStatus(): ConnectionStatus {
  return useSyncExternalStore(connectionStatus.subscribe, connectionStatus.get)
}
