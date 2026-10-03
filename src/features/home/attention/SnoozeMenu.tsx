import { useState } from 'react'
import type { SnoozeDuration } from './useSnoozes'

// A visible button, not a hold gesture: the wall screen has no hover or long-press.
export function SnoozeMenu({
  title,
  disabled,
  onChoose,
}: {
  title: string
  disabled: boolean
  onChoose: (duration: SnoozeDuration) => void
}) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        className="snooze-button"
        aria-label={`Snooze ${title}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Snooze
      </button>
    )
  }
  const choose = (duration: SnoozeDuration) => {
    setOpen(false)
    onChoose(duration)
  }
  return (
    <span role="group" aria-label={`Snooze ${title}`} className="snooze-choices">
      <button type="button" disabled={disabled} onClick={() => choose('day')}>
        1 day
      </button>
      <button type="button" disabled={disabled} onClick={() => choose('week')}>
        1 week
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  )
}
