import { AlarmClock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  // Opening swaps the Snooze button for the choices, so focus has to be moved by hand
  // or it falls back to the page; Cancel hands it back.
  const firstChoice = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)
  useEffect(() => {
    if (open) firstChoice.current?.focus()
    else if (returnFocus.current) {
      returnFocus.current = false
      trigger.current?.focus()
    }
  }, [open])

  if (!open) {
    return (
      <button
        ref={trigger}
        type="button"
        className="icon-button snooze-button"
        aria-label={`Snooze ${title}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <AlarmClock aria-hidden="true" size={18} />
      </button>
    )
  }
  const choose = (duration: SnoozeDuration) => {
    setOpen(false)
    onChoose(duration)
  }
  return (
    <span role="group" aria-label={`Snooze ${title}`} className="snooze-choices">
      <button ref={firstChoice} type="button" disabled={disabled} onClick={() => choose('day')}>
        1 day
      </button>
      <button type="button" disabled={disabled} onClick={() => choose('week')}>
        1 week
      </button>
      <button
        type="button"
        className="button--quiet"
        onClick={() => {
          returnFocus.current = true
          setOpen(false)
        }}
      >
        Cancel
      </button>
    </span>
  )
}
