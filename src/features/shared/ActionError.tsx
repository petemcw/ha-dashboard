import type { ActionFailure } from '../../infrastructure/serviceGateway/useAction'
import './ActionError.css'

const MESSAGES: Record<ActionFailure, string> = {
  rejected: "Didn't work, tap to retry",
  // The socket dropped with the call in flight, so HA may have run it: don't invite a blind retry.
  'connection-lost': 'Connection dropped, check before retrying',
}

// The live region is always rendered, empty, so screen readers announce the text when it arrives.
export function ActionError({ failure }: { failure: ActionFailure | null }) {
  return (
    <span className="action-error" role="status">
      {failure ? MESSAGES[failure] : ''}
    </span>
  )
}
