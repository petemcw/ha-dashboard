import { useEffect, useRef, useState, type RefObject } from 'react'

// Long enough to reach for the button again, short enough that an armed door button
// doesn't sit there waiting on a wall screen.
export const CONFIRM_WINDOW_MS = 4_000
// A bump or double tap sends two clicks 100-300 ms apart; that must not arm and confirm
// in one gesture.
export const CONFIRM_GUARD_MS = 500

// The tap-twice behavior behind every confirm control: the first press arms, a second
// press after the guard confirms, and a tap elsewhere, focus leaving, the window running
// out, or the control going disabled disarms. The caller renders the button, wires its press
// to `onPress`, and spreads `buttonProps` onto it.
//
// With `required: false` (a tile or media button whose entity isn't confirm-listed) the press
// sends at once: `onPress` is `onConfirm`, nothing ever arms, and `buttonProps` is empty. The
// hook is still called, so a control can switch between the two without breaking hook order.
type ConfirmButtonProps = {
  ref?: RefObject<HTMLButtonElement | null>
  onPointerDown?: () => void
  onBlur?: () => void
}

export function useConfirmArm({
  disabled,
  onConfirm,
  required = true,
}: {
  disabled?: boolean
  onConfirm: () => void
  required?: boolean
}): { armed: boolean; onPress: () => void; buttonProps: ConfirmButtonProps } {
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

  const onPress = () => {
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

  if (!required) return { armed: false, onPress: onConfirm, buttonProps: {} }
  return {
    armed,
    onPress,
    buttonProps: {
      ref: buttonRef,
      onPointerDown: () => (pressing.current = true),
      onBlur: () => {
        if (!pressing.current) disarm()
      },
    },
  }
}
