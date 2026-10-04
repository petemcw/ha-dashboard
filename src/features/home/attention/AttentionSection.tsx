import { useState } from 'react'
import { UndoNotice } from '../../shared/UndoNotice'
import { SectionCard } from '../SectionCard'
import { ChoreRow } from './ChoreRow'
import { SnoozedList } from './SnoozedList'
import { formatUntil } from './snoozes'
import { UrgentItem } from './UrgentItem'
import type { Attention } from './useAttention'

export function AttentionSection({ attention }: { attention: Attention }) {
  const { items, urgent, chores, snoozed, snoozing } = attention
  // The item vanishes from the list when snoozed, so say where it went and offer Undo.
  const [notice, setNotice] = useState<{ id: string; message: string; at: number }>()
  const snooze = snoozing.canSnooze
    ? {
        disabled: snoozing.pending,
        onSnooze: (id: string, duration: Parameters<typeof snoozing.snooze>[1]) => {
          const until = snoozing.snooze(id, duration)
          setNotice({ id, message: `Snoozed until ${formatUntil(until)}`, at: Date.now() })
        },
      }
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
      {notice && !snoozing.error && (
        <UndoNotice
          key={notice.at}
          message={notice.message}
          undoDisabled={snoozing.pending}
          onUndo={() => {
            snoozing.unsnooze(notice.id)
            setNotice(undefined)
          }}
          onDismiss={() => setNotice(undefined)}
        />
      )}
    </SectionCard>
  )
}
