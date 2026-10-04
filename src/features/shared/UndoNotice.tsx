import { useEffect, useRef } from 'react'

// Long enough to read and reach for Undo, short enough not to linger on a wall screen.
export const UNDO_NOTICE_MS = 8_000

type UndoNoticeProps = {
  message: string
  onUndo: () => void
  onDismiss: () => void
  undoDisabled?: boolean
  inline?: boolean
}

// Confirms an action that just happened and offers to take it back, instead of asking
// "are you sure?" first. Announced politely; focus stays where it was.
export function UndoNotice({ message, onUndo, onDismiss, undoDisabled, inline }: UndoNoticeProps) {
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
    <div className={inline ? 'undo-notice undo-notice--inline' : 'undo-notice'} role="status">
      <span>{message}</span>
      <button type="button" className="button--quiet" disabled={undoDisabled} onClick={onUndo}>
        Undo
      </button>
    </div>
  )
}
