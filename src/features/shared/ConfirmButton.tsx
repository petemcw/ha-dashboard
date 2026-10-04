import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ActionButton } from './ActionButton'
import './ConfirmButton.css'

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
    // A press released off the button never reaches its own pointerup, which would leave
    // `pressing` set and make a later Tab-away look like part of a press.
    const onRelease = () => (pressing.current = false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onRelease)
    document.addEventListener('pointercancel', onRelease)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onRelease)
      document.removeEventListener('pointercancel', onRelease)
    }
  }, [armed])

  // A connection drop must not leave a live confirm that fires after reconnecting.
  // (Adjusted during render rather than in an effect, so there is no armed frame.)
  if (disabled && armed) setArmed(false)

  // ActionButton drops taps while pending, and a disabled button gets none.
  const handleClick = () => {
    if (!armed) {
      armedAt.current = Date.now()
      // The click follows the pointerup, which no document listener saw yet.
      pressing.current = false
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
        onBlur={() => {
          if (!pressing.current) disarm()
        }}
        onPress={handleClick}
      >
        {icon}
        {/* The accessible name is confirmLabel; the visible word stays short. Always
            rendered, collapsed while unarmed, so disarming slides it shut from wherever it
            is instead of dropping it in one frame. */}
        <span className="button__confirm-text" aria-hidden="true">
          Confirm?
        </span>
      </ActionButton>
      {/* A changing button name isn't announced on its own. */}
      <span className="visually-hidden" role="status">
        {armed ? confirmLabel : ''}
      </span>
    </>
  )
}
