import type { ReactNode } from 'react'
import { ActionButton } from './ActionButton'
import './ConfirmButton.css'
import { ConfirmAnnouncement } from './ConfirmAnnouncement'
import { useConfirmArm } from './useConfirmArm'

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
  const { armed, onPress, buttonProps } = useConfirmArm({ disabled, onConfirm })

  const name = pending ? pendingLabel : armed ? confirmLabel : label

  return (
    <>
      <ActionButton
        className={armed ? 'button--confirm button--confirm-armed' : 'button--confirm'}
        disabled={disabled}
        pending={pending}
        {...buttonProps}
        aria-label={name}
        onPress={onPress}
      >
        {icon}
        {/* The accessible name is confirmLabel; the visible word stays short. Always
            rendered, collapsed while unarmed, so disarming slides it shut from wherever it
            is instead of dropping it in one frame. */}
        <span className="button__confirm-text" aria-hidden="true">
          Confirm?
        </span>
      </ActionButton>
      <ConfirmAnnouncement text={armed ? confirmLabel : ''} />
    </>
  )
}
