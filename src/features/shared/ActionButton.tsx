import type { ComponentPropsWithRef } from 'react'
import './ActionButton.css'

type ActionButtonProps = Omit<ComponentPropsWithRef<'button'>, 'type' | 'onClick'> & {
  onPress: () => void
  pending?: boolean
}

// The button every control sends through. While pending it uses aria-disabled, not
// disabled, so keyboard focus stays on it, and a tap is ignored instead of sent twice.
export function ActionButton({ onPress, pending, className, ...button }: ActionButtonProps) {
  return (
    <button
      type="button"
      {...button}
      className={className ? `action-button ${className}` : 'action-button'}
      aria-disabled={pending || undefined}
      onClick={() => {
        if (!pending) onPress()
      }}
    />
  )
}
