import { getConnection } from '../../../infrastructure/ha/connection'
import { ChoreRow } from './ChoreRow'
import { SnoozedList } from './SnoozedList'
import { UrgentItem } from './UrgentItem'
import { useAttentionItems } from './useAttentionItems'
import { useSnoozes } from './useSnoozes'

export function AttentionSection({ connect = getConnection }: { connect?: typeof getConnection }) {
  const { items: all, resolvedIds } = useAttentionItems()
  const snoozing = useSnoozes(resolvedIds, connect)
  const items = all.filter((i) => !snoozing.isSnoozed(i.id))
  const snoozed = all.filter((i) => snoozing.isSnoozed(i.id))
  const urgent = items.filter((i) => i.tier === 'urgent')
  const chores = items.filter((i) => i.tier === 'chore')
  const snooze = snoozing.canSnooze
    ? { disabled: snoozing.pending, onSnooze: snoozing.snooze }
    : undefined
  return (
    <section aria-label="Needs attention">
      {items.length === 0 && <p>Nothing needs attention</p>}
      {urgent.length > 0 && (
        <ul>
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
    </section>
  )
}
