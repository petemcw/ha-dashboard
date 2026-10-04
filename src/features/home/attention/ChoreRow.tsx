import { ItemAction } from './ItemAction'
import { SnoozeMenu } from './SnoozeMenu'
import type { AttentionItem } from './types'
import type { SnoozeControls } from './UrgentItem'

// Chores are quieter than urgent items: a list of rows under the urgent banners.
export function ChoreRow({ items, snooze }: { items: AttentionItem[]; snooze?: SnoozeControls }) {
  return (
    <ul className="chore-row" aria-label="Chores">
      {items.map((item) => (
        <li key={item.id} className="attention-item chore-item">
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
      ))}
    </ul>
  )
}
