import { useConnectionStatus } from '../ha/useConnectionStatus'

// Controls only work while HA is reachable; otherwise they render disabled.
export function useControlsEnabled(): boolean {
  return useConnectionStatus().kind === 'connected'
}
