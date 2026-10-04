import { useEffect, useRef, useState } from 'react'
import { ServiceCallError, type ServiceGateway } from './serviceGateway'
import { useServiceGateway } from './ServiceGatewayProvider'
import { useControlsEnabled } from './useControlsEnabled'

export type ActionFailure = ServiceCallError['kind']

export type ActionState = {
  // False unless HA is connected: the control renders disabled rather than queue a tap.
  enabled: boolean
  pending: boolean
  // Why the last run failed. Cleared on the next run, after 60 s, or when clearKey changes,
  // so an error can't sit on a wall tablet for days.
  failure: ActionFailure | null
  // Runs a domain action against the provided gateway, the only way a control sends.
  run: (action: (gateway: ServiceGateway) => Promise<unknown>) => void
}

const FAILURE_TTL_MS = 60_000

// Holds a control's pending and failed state. Pending is the action's own state, never an
// optimistic copy of the entity: the screen keeps showing what HA reports.
export function useAction({ clearKey }: { clearKey?: unknown } = {}): ActionState {
  const gateway = useServiceGateway()
  const enabled = useControlsEnabled()
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<ActionFailure | null>(null)

  useEffect(() => {
    if (!failure) return
    const timer = setTimeout(() => setFailure(null), FAILURE_TTL_MS)
    return () => clearTimeout(timer)
  }, [failure])

  const firstKey = useRef(true)
  useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailure(null)
  }, [clearKey])

  const run = (action: (gateway: ServiceGateway) => Promise<unknown>) => {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setFailure(null)
    action(gateway)
      .catch((error) => setFailure(error instanceof ServiceCallError ? error.kind : 'rejected'))
      .finally(() => {
        inFlight.current = false
        setPending(false)
      })
  }

  return { enabled, pending, failure, run }
}
