import { UndoNoticeFrame, type UndoNoticeProps } from './UndoNoticeFrame'

// Confirms an action that just happened and offers to take it back, instead of asking
// "are you sure?" first. Floats at the bottom of the screen, where a thumb rests.
export function UndoNotice(props: UndoNoticeProps) {
  return <UndoNoticeFrame className="undo-notice" {...props} />
}
