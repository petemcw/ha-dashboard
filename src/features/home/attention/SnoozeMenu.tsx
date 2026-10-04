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
  // Opening makes the Snooze button inert under the choices, so focus has to be moved by
  // hand or it falls back to the page; Cancel hands it back.
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

  const choose = (duration: SnoozeDuration) => {
    setOpen(false)
    onChoose(duration)
  }
  // Both always render: the choices open over the row (see AttentionSection.css) and slide
  // away again on close, so each side is inert and hidden while the other is in use.
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="icon-button snooze-button"
        aria-label={`Snooze ${title}`}
        disabled={disabled}
        inert={open}
        aria-hidden={open || undefined}
        onClick={() => setOpen(true)}
      >
        <AlarmClock aria-hidden="true" size={18} />
      </button>
      <span
        role="group"
        aria-label={`Snooze ${title}`}
        className={open ? 'snooze-choices snooze-choices--open' : 'snooze-choices'}
        inert={!open}
        aria-hidden={!open || undefined}
      >
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
    </>
  )
}
