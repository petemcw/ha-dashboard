import type { AttentionItem } from './types'
import { AttentionAction } from './AttentionAction'

// Links don't change devices; everything else goes through the gateway.
export function ItemAction({ action }: { action: AttentionItem['action'] }) {
  if (!action) return null
  if ('href' in action) {
    return (
      <a className="button-link" href={action.href} target="_blank" rel="noopener noreferrer">
        {action.label}
      </a>
    )
  }
  return <AttentionAction action={action} />
}
