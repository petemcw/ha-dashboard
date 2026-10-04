import { Clock } from 'lucide-react'
import { useId, useState } from 'react'
import { UndoNotice } from '../../shared/UndoNotice'
import { SectionCard } from '../SectionCard'
import { AttentionRow } from './AttentionRow'
import { SnoozedList } from './SnoozedList'
import { formatUntil } from './snoozes'
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
  const listId = useId()
  const [expanded, setExpanded] = useState(false)
  const toggle = (
    <button
      type="button"
      className="button--quiet snoozed__toggle"
      aria-expanded={expanded}
      aria-controls={listId}
      onClick={() => setExpanded((open) => !open)}
    >
      {expanded ? 'Hide' : 'Show'}
    </button>
  )
  const list = expanded && (
    <SnoozedList
      id={listId}
      items={snoozed}
      until={snoozing.until}
      onUnsnooze={snoozing.canSnooze ? snoozing.unsnooze : undefined}
      disabled={snoozing.pending}
    />
  )
  // The card and the strip never both show, so they never both show the failure.
  const status = (
    <>
      {!snoozing.readable && <p role="status">Snoozes are unavailable.</p>}
      {snoozing.error && <p role="alert">{snoozing.error}</p>}
    </>
  )
  const showCard = items.length > 0
  const showStrip = !showCard && snoozed.length > 0
  return (
    <>
      {showCard && (
        <SectionCard
          title="Needs attention"
          className="attention"
          chip={countChip(urgent.length, chores.length)}
        >
          {/* Chores share the row layout with urgent items; the badge colour tells them apart. */}
          {urgent.length > 0 && (
            <ul className="urgent-list">
              {urgent.map((item) => (
                <AttentionRow key={item.id} item={item} snooze={snooze} />
              ))}
            </ul>
          )}
          {chores.length > 0 && (
            <ul className="chore-row" aria-label="Chores">
              {chores.map((item) => (
                <AttentionRow key={item.id} item={item} snooze={snooze} />
              ))}
            </ul>
          )}
          {snoozed.length > 0 && (
            <div className="snoozed__foot">
              <span>{`${snoozed.length} snoozed`}</span>
              {toggle}
            </div>
          )}
          {list}
          {status}
        </SectionCard>
      )}
      {showStrip && (
        <section className="snoozed" aria-label="Snoozed">
          <div className="snoozed__bar">
            <Clock size={16} aria-hidden="true" />
            <span>
              <b>{`${snoozed.length} snoozed`}</b> · {snoozed[0].title}
            </span>
            {toggle}
          </div>
          {list}
          {status}
        </section>
      )}
      {/* Outside the card: snoozing the last item unmounts it, and the Undo must survive. */}
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
    </>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function countChip(urgent: number, chores: number) {
  const parts = [urgent > 0 && `${urgent} urgent`, chores > 0 && plural(chores, 'chore')].filter(
    Boolean,
  )
  return (
    <span className={`attention__chip attention__chip--${urgent > 0 ? 'danger' : 'warn'}`}>
      {parts.join(' · ')}
    </span>
  )
}
