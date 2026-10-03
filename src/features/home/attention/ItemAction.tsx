import { useId } from 'react'
import type { AttentionItem } from './types'

// v1 sends no actions: buttons render disabled. Links are fine since they don't
// change devices.
export function ItemAction({ action }: { action: AttentionItem['action'] }) {
  const helpId = useId()
  if (!action) return null
  if ('href' in action) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer">
        {action.label}
      </a>
    )
  }
  return (
    <>
      <button type="button" disabled aria-describedby={helpId}>
        {action.label}
      </button>
      <span id={helpId} hidden>
        Available when controls are enabled
      </span>
    </>
  )
}
