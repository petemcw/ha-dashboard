import type { ComponentPropsWithRef } from 'react'

type ActionButtonProps = Omit<ComponentPropsWithRef<'button'>, 'type' | 'onClick'> & {
  onPress: () => void
  pending?: boolean
}

// The button every control sends through. While pending it uses aria-disabled, not
// disabled, so keyboard focus stays on it, and a tap is ignored instead of sent twice.
export function ActionButton({ onPress, pending, ...button }: ActionButtonProps) {
  return (
    <button
      type="button"
      {...button}
      aria-disabled={pending || undefined}
      onClick={() => {
        if (!pending) onPress()
      }}
    />
  )
}
