import { ItemAction } from './ItemAction'
import { SnoozeMenu } from './SnoozeMenu'
import type { AttentionItem } from './types'
import type { SnoozeDuration } from './useSnoozes'

export type SnoozeControls = {
  disabled: boolean
  onSnooze: (id: string, duration: SnoozeDuration) => void
}

// Undefined `snooze` means this user gets no snooze action.
export function UrgentItem({ item, snooze }: { item: AttentionItem; snooze?: SnoozeControls }) {
  return (
    <li className="urgent-item">
      <div>
        <strong>{item.title}</strong>
        <p>{item.detail}</p>
      </div>
      <ItemAction action={item.action} />
      {snooze && (
        <SnoozeMenu
          title={item.title}
          disabled={snooze.disabled}
          onChoose={(d) => snooze.onSnooze(item.id, d)}
        />
      )}
    </li>
  )
}
