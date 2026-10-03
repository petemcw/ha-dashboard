import { ItemAction } from './ItemAction'
import { SnoozeMenu } from './SnoozeMenu'
import type { AttentionItem } from './types'
import type { SnoozeControls } from './UrgentItem'

// Chores are one line each; the min-height keeps every row a 44 px touch target.
export function ChoreRow({ items, snooze }: { items: AttentionItem[]; snooze?: SnoozeControls }) {
  return (
    <ul className="chore-row" aria-label="Chores">
      {items.map((item) => (
        <li key={item.id} className="chore-item">
          <strong>{item.title}</strong>
          {item.detail && <span>{item.detail}</span>}
          <ItemAction action={item.action} />
          {snooze && (
            <SnoozeMenu
              title={item.title}
              disabled={snooze.disabled}
              onChoose={(d) => snooze.onSnooze(item.id, d)}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
