import { UndoNoticeFrame, type UndoNoticeProps } from './UndoNoticeFrame'

// An undo notice that sits in the page flow, above the list it changed, for screens (the
// favorites editor's sheet) where a floating one would cover the controls.
export function InlineUndoNotice(props: UndoNoticeProps) {
  return <UndoNoticeFrame className="undo-notice undo-notice--inline" {...props} />
}
