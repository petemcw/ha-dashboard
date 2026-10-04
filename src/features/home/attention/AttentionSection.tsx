import { SectionCard } from '../SectionCard'
import { ChoreRow } from './ChoreRow'
import { SnoozedList } from './SnoozedList'
import { UrgentItem } from './UrgentItem'
import type { Attention } from './useAttention'

export function AttentionSection({ attention }: { attention: Attention }) {
  const { items, urgent, chores, snoozed, snoozing } = attention
  const snooze = snoozing.canSnooze
    ? { disabled: snoozing.pending, onSnooze: snoozing.snooze }
    : undefined
  return (
    // No count here: the house sign above already says how many things are waiting.
    <SectionCard title="Needs attention" className="attention">
      {items.length === 0 && <p className="all-clear">Nothing needs attention</p>}
      {urgent.length > 0 && (
        <ul className="urgent-list">
          {urgent.map((item) => (
            <UrgentItem key={item.id} item={item} snooze={snooze} />
          ))}
        </ul>
      )}
      {chores.length > 0 && <ChoreRow items={chores} snooze={snooze} />}
      <SnoozedList
        items={snoozed}
        until={snoozing.until}
        onUnsnooze={snoozing.canSnooze ? snoozing.unsnooze : undefined}
        disabled={snoozing.pending}
      />
      {!snoozing.readable && <p role="status">Snoozes are unavailable.</p>}
      {snoozing.error && <p role="alert">{snoozing.error}</p>}
    </SectionCard>
  )
}
