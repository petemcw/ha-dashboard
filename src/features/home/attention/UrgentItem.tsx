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
    <li className="attention-item urgent-item">
      <div className="attention-item__text">
        <strong className="attention-item__title">{item.title}</strong>
        {item.detail && <span className="attention-item__detail">{item.detail}</span>}
      </div>
      <div className="attention-item__actions">
        <ItemAction action={item.action} />
        {snooze && (
          <SnoozeMenu
            title={item.title}
            disabled={snooze.disabled}
            onChoose={(d) => snooze.onSnooze(item.id, d)}
          />
        )}
      </div>
    </li>
  )
}
