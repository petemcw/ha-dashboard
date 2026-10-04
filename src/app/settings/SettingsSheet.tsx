import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import {
  animateSpring,
  projectMomentum,
  rubberband,
  type SpringAnimation,
  type SpringParams,
} from '../motion/spring'
import './SettingsSheet.css'

type SettingsSheetProps = { open: boolean; onClose: () => void; children?: ReactNode }

// Disabled controls can't take focus, so a trap that counts them lets Tab escape.
const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

// Opening and closing from a tap: no overshoot. Springing back after a drag: a little,
// because the finger's momentum carries into it.
const SETTLE: SpringParams = { damping: 1, response: 0.35 }
const SPRING_BACK: SpringParams = { damping: 0.8, response: 0.3 }
// How far a release must project, as a share of the sheet's height, to dismiss it.
const DISMISS_AT = 0.5
// Velocity is measured over the last stretch of the drag, not its whole length.
const VELOCITY_WINDOW_MS = 100

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// A modal bottom sheet with sections as children, so later tasks add theirs in separate
// files. It rises from the bottom edge and leaves the same way, follows a drag on its
// header, and a flick down dismisses it.
export function SettingsSheet({ open, onClose, children }: SettingsSheetProps) {
  // Stays mounted after `open` turns false until the sheet has slid out.
  const [shown, setShown] = useState(open)
  if (open && !shown) setShown(true)

  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const offset = useRef(0)
  const animation = useRef<SpringAnimation | undefined>(undefined)
  const releaseVelocity = useRef(0)
  const drag = useRef<{ startOffset: number; startY: number; samples: { t: number; y: number }[] }>(
    undefined,
  )

  const height = () => sheetRef.current?.offsetHeight ?? 0

  const place = (value: number) => {
    offset.current = value
    const sheet = sheetRef.current
    const backdrop = backdropRef.current
    if (sheet) sheet.style.transform = `translateY(${value}px)`
    const h = height()
    // The scrim dims with how open the sheet is, so a drag shows what letting go will do.
    if (backdrop) backdrop.style.opacity = h ? String(Math.min(1, Math.max(0, 1 - value / h))) : ''
  }

  // Every animation starts from where the sheet is on screen right now, with the
  // velocity it has, so it can be interrupted and redirected at any moment.
  const moveTo = (target: number, params: SpringParams, onDone?: () => void) => {
    const live = animation.current?.stop()
    const velocity = releaseVelocity.current || live?.velocity || 0
    releaseVelocity.current = 0
    if (reduceMotion()) {
      place(target)
      onDone?.()
      return
    }
    animation.current = animateSpring(
      { value: offset.current, velocity, done: false },
      target,
      params,
      place,
      onDone,
    )
  }

  useLayoutEffect(() => {
    if (!shown) return
    if (open) {
      // Fresh open: start just below the screen edge, then rise.
      if (!animation.current) place(height())
      moveTo(0, SETTLE)
    } else {
      moveTo(height(), SETTLE, () => {
        animation.current = undefined
        setShown(false)
      })
    }
    // moveTo and place only touch refs and the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shown])

  useEffect(() => () => void animation.current?.stop(), [])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => previous?.focus()
  }, [open])

  if (!shown) return null

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    // Keep Tab inside the sheet.
    const items = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (!items?.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    // Buttons in the header (Close) keep working as buttons.
    if (!open || (e.target as HTMLElement).closest('button, a, input')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    // Grab the sheet where it is, mid-animation included.
    animation.current?.stop()
    animation.current = undefined
    drag.current = {
      startOffset: offset.current,
      startY: e.clientY,
      samples: [{ t: e.timeStamp, y: offset.current }],
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const raw = d.startOffset + (e.clientY - d.startY)
    // Above the open position there's nothing more: resist instead of stopping dead.
    const next = raw < 0 ? rubberband(raw, height()) : raw
    place(next)
    d.samples.push({ t: e.timeStamp, y: next })
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > VELOCITY_WINDOW_MS) {
      d.samples.shift()
    }
  }

  const onPointerEnd = () => {
    const d = drag.current
    if (!d) return
    drag.current = undefined
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const elapsed = (last.t - first.t) / 1000
    const velocity = elapsed > 0 ? (last.y - first.y) / elapsed : 0
    releaseVelocity.current = velocity
    // Decide by where the flick is heading, not where the finger let go.
    if (offset.current + projectMomentum(velocity) > height() * DISMISS_AT) onClose()
    else moveTo(0, SPRING_BACK)
  }

  const dragHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  }

  return (
    <div className="sheet-layer">
      <div
        ref={backdropRef}
        className="sheet-backdrop"
        data-testid="sheet-backdrop"
        // Only a tap on the dimmed area itself closes; the sheet sits above it.
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onKeyDown={onKeyDown}
      >
        <div className="sheet__grabber" aria-hidden="true" {...dragHandlers} />
        <header className="sheet__header" {...dragHandlers}>
          <h2 id="settings-title">Settings</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
