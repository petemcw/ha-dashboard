import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

// Horizontal movement beyond vertical, in px, before a press becomes a drag. Until then a
// press is a tap (or the start of a vertical scroll), so brightness can't change while
// someone scrolls the page.
const ENGAGE_PX = 8
const KEY_STEP = 10
// A held arrow key repeats; wait for the key to settle so it sends once.
const KEY_DEBOUNCE_MS = 250

type Local = { value: number; sent: boolean }

export type SliderGesture = ReturnType<typeof useSliderGesture>

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)))

// A 0-100 value set by dragging across a surface (any element: the surface and the
// <Slider> that exposes it to keyboards and screen readers are separate, so a tile can be its
// own drag surface) or by keys. The value is sent once, on release or key up, never while it
// moves. While dragging, and while that send is `pending`, `shown` is the local value; after
// that it is `value` again, because HA's state is the truth (no optimistic copy).
export function useSliderGesture({
  value,
  disabled,
  pending,
  onCommit,
}: {
  value: number
  disabled?: boolean
  pending?: boolean
  onCommit: (value: number) => void
}) {
  const [local, setLocal] = useState<Local>()
  // Cleared in render, not an effect, so no frame shows the stale released value.
  if (local?.sent && !pending) setLocal(undefined)

  const shown = local?.value ?? value
  const latest = useRef(shown)
  const commitRef = useRef(onCommit)
  useEffect(() => {
    latest.current = shown
    commitRef.current = onCommit
  })

  const press = useRef<{
    id: number
    x: number
    y: number
    from: number
    width: number
    engaged: boolean
  }>(undefined)
  const swallowClick = useRef(false)
  const keyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(keyTimer.current), [])

  const commit = (next: number) => {
    setLocal({ value: next, sent: true })
    commitRef.current(next)
  }

  const surface = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (disabled || !e.isPrimary) return
      swallowClick.current = false
      press.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        from: latest.current,
        width: e.currentTarget.getBoundingClientRect().width,
        engaged: false,
      }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const p = press.current
      if (!p || p.id !== e.pointerId) return
      const dx = e.clientX - p.x
      if (!p.engaged) {
        if (Math.abs(dx) - Math.abs(e.clientY - p.y) < ENGAGE_PX) return
        p.engaged = true
        // Keeps tracking when the finger leaves the tile.
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      if (p.width > 0) setLocal({ value: clamp(p.from + (dx / p.width) * 100), sent: false })
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const p = press.current
      if (!p || p.id !== e.pointerId) return
      press.current = undefined
      if (!p.engaged) return
      // The browser still fires a click on the button after a drag; it must not toggle.
      swallowClick.current = true
      setTimeout(() => (swallowClick.current = false), 0)
      commit(latest.current)
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      if (press.current?.id !== e.pointerId) return
      // The browser took the gesture (a vertical scroll): nothing was chosen.
      press.current = undefined
      setLocal(undefined)
    },
  }

  const keyboard = {
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return
      const step: Record<string, () => number> = {
        ArrowRight: () => latest.current + KEY_STEP,
        ArrowUp: () => latest.current + KEY_STEP,
        ArrowLeft: () => latest.current - KEY_STEP,
        ArrowDown: () => latest.current - KEY_STEP,
        Home: () => 1,
        End: () => 100,
      }
      const next = step[e.key]
      if (!next) return
      e.preventDefault()
      clearTimeout(keyTimer.current)
      const value = clamp(next())
      latest.current = value
      setLocal({ value, sent: false })
    },
    onKeyUp: () => {
      if (!local || local.sent) return
      clearTimeout(keyTimer.current)
      keyTimer.current = setTimeout(() => commit(latest.current), KEY_DEBOUNCE_MS)
    },
  }

  return {
    shown,
    // The value on screen isn't HA's: it is being dragged, or its send is in flight.
    active: local !== undefined,
    surface,
    keyboard,
    // True once, for the click that follows a drag's release.
    consumeClick: () => {
      const swallow = swallowClick.current
      swallowClick.current = false
      return swallow
    },
  }
}
