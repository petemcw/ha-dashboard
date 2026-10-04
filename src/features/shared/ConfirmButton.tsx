import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  // The button's only visible content until armed; the labels are its accessible name.
  icon: ReactNode
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
  icon,
  onConfirm,
  disabled,
  pending,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)
  const armedAt = useRef(0)
  const revertTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // True from a pointer press on the button until it is released, so a blur caused by the
  // press itself (some browsers move focus around on tap) doesn't count as focus leaving.
  const pressing = useRef(false)

  const disarm = () => {
    clearTimeout(revertTimer.current)
    setArmed(false)
  }

  useEffect(() => () => clearTimeout(revertTimer.current), [])

  // A tap anywhere else cancels, so an armed door button doesn't wait for the 4 s timeout.
  // Listening only while armed keeps idle rows free of document handlers.
  useEffect(() => {
    if (!armed) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && buttonRef.current?.contains(event.target)) return
      disarm()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [armed])

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
        ref={buttonRef}
        aria-label={name}
        onPointerDown={() => (pressing.current = true)}
        onPointerUp={() => (pressing.current = false)}
        onPointerCancel={() => (pressing.current = false)}
        onBlur={() => {
          if (!pressing.current) disarm()
        }}
        onPress={handleClick}
      >
        {icon}
        {/* The accessible name is confirmLabel; the visible word stays short. */}
        {armed && !pending && <span className="button__confirm-text">Confirm?</span>}
      </ActionButton>
      {/* A changing button name isn't announced on its own. */}
      <span className="visually-hidden" role="status">
        {armed ? confirmLabel : ''}
      </span>
    </>
  )
}
