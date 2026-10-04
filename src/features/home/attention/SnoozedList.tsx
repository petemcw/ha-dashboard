import { formatUntil } from './snoozes'
import type { AttentionItem } from './types'

type Props = {
  id: string
  items: AttentionItem[]
  until: (id: string) => Date | undefined
  // Undefined for non-admins: they see what's snoozed but can't undo it.
  onUnsnooze?: (id: string) => void
  disabled: boolean
  // Collapsed lists stay in the DOM so the toggle's aria-controls always points at them.
  hidden: boolean
}

export function SnoozedList({ id, items, until, onUnsnooze, disabled, hidden }: Props) {
  return (
    <ul className="snoozed__list" id={id} hidden={hidden}>
      {items.map((item) => {
        const end = until(item.id)
        return (
          <li key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>
                {end ? `${item.detail} · snoozed until ${formatUntil(end)}` : item.detail}
              </span>
            </div>
            {onUnsnooze && (
              <button
                type="button"
                className="button--quiet"
                aria-label={`Unsnooze ${item.title}`}
                disabled={disabled}
                onClick={() => onUnsnooze(item.id)}
              >
                Unsnooze
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
