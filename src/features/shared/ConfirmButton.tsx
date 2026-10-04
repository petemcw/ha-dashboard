import { useEffect, useRef, useState } from 'react'
import { ActionButton } from './ActionButton'

// Long enough to reach for the button again, short enough that an armed door button
// doesn't sit there waiting on a wall screen.
export const CONFIRM_WINDOW_MS = 4_000
// A bump or double tap sends two clicks 100-300 ms apart; that must not arm and confirm
// in one gesture.
export const CONFIRM_GUARD_MS = 500

type ConfirmButtonProps = {
  label: string
  confirmLabel: string
  pendingLabel: string
  onConfirm: () => void
  disabled?: boolean
  pending?: boolean
}

// Inline tap-twice confirmation: no modal, nothing hover-only. It only renders the
// button; the caller shows any failure next to it.
export function ConfirmButton({
  label,
  confirmLabel,
  pendingLabel,
  onConfirm,
  disabled,
  pending,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)
  const armedAt = useRef(0)
  const revertTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const disarm = () => {
    clearTimeout(revertTimer.current)
    setArmed(false)
  }

  useEffect(() => () => clearTimeout(revertTimer.current), [])

  // A connection drop must not leave a live confirm that fires after reconnecting.
  // (Adjusted during render rather than in an effect, so there is no armed frame.)
  if (disabled && armed) setArmed(false)

  // ActionButton drops taps while pending, and a disabled button gets none.
  const handleClick = () => {
    if (!armed) {
      armedAt.current = Date.now()
      setArmed(true)
      revertTimer.current = setTimeout(disarm, CONFIRM_WINDOW_MS)
      return
    }
    if (Date.now() - armedAt.current < CONFIRM_GUARD_MS) return
    disarm()
    onConfirm()
  }

  const name = pending ? pendingLabel : armed ? confirmLabel : label

  return (
    <>
      <ActionButton
        className={armed ? 'button--confirm button--confirm-armed' : 'button--confirm'}
        disabled={disabled}
        pending={pending}
        onPress={handleClick}
      >
        {name}
      </ActionButton>
      {/* A changing button name isn't announced on its own. */}
      <span className="visually-hidden" role="status">
        {armed ? confirmLabel : ''}
      </span>
    </>
  )
}
