import { useEffect, useRef } from 'react'
import './UndoNotice.css'

// Long enough to read and reach for Undo, short enough not to linger on a wall screen.
export const UNDO_NOTICE_MS = 8_000

export type UndoNoticeProps = {
  message: string
  onUndo: () => void
  onDismiss: () => void
  undoDisabled?: boolean
}

// What every undo notice is, wherever it sits: the message, the Undo, and the timer that
// dismisses it. Announced politely; focus stays where it was.
export function UndoNoticeFrame({
  className,
  message,
  onUndo,
  onDismiss,
  undoDisabled,
}: UndoNoticeProps & { className: string }) {
  // The parent re-renders on every clock tick; the timer must not restart with it.
  const dismiss = useRef(onDismiss)
  useEffect(() => {
    dismiss.current = onDismiss
  })
  useEffect(() => {
    const timer = setTimeout(() => dismiss.current(), UNDO_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={className} role="status">
      <span>{message}</span>
      <button type="button" className="button--quiet" disabled={undoDisabled} onClick={onUndo}>
        Undo
      </button>
    </div>
  )
}
