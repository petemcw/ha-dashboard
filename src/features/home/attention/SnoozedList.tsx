import type { AttentionItem } from './types'

const formatUntil = (d: Date) =>
  d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })

type Props = {
  items: AttentionItem[]
  until: (id: string) => Date | undefined
  // Undefined for non-admins: they see what's snoozed but can't undo it.
  onUnsnooze?: (id: string) => void
  disabled: boolean
}

export function SnoozedList({ items, until, onUnsnooze, disabled }: Props) {
  if (items.length === 0) return null
  return (
    <details className="snoozed">
      <summary>{`${items.length} snoozed`}</summary>
      <ul>
        {items.map((item) => {
          const end = until(item.id)
          return (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {end && <span>until {formatUntil(end)}</span>}
              {onUnsnooze && (
                <button
                  type="button"
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
    </details>
  )
}
