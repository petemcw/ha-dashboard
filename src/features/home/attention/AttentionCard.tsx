import type { ReactNode } from 'react'
import { Chip } from '../../shared/Chip'
import { useFoldAway } from '../../shared/useFoldAway'
import type { Shown } from '../../shared/useLeavingItems'
import { SectionCard } from '../../shared/SectionCard'
import { AttentionRow, type SnoozeControls } from './AttentionRow'
import type { AttentionItem } from './types'

type AttentionCardProps = {
  urgent: Shown<AttentionItem>[]
  chores: Shown<AttentionItem>[]
  snooze?: SnoozeControls
  // Under the rows: the snoozed footer and list, and any snooze status.
  children?: ReactNode
}

// The primary card. A row whose item resolved or was snoozed folds out of the list; when
// every row is leaving, the whole card folds away with them, keeping its counts meanwhile.
export function AttentionCard({ urgent, chores, snooze, children }: AttentionCardProps) {
  const leaving = [...urgent, ...chores].every((shown) => shown.leaving)
  const card = useFoldAway<HTMLElement>(leaving)
  const count = (rows: Shown<AttentionItem>[]) =>
    leaving ? rows.length : rows.filter((shown) => !shown.leaving).length
  return (
    <SectionCard
      ref={card}
      inert={leaving}
      title="Needs attention"
      className={leaving ? 'attention card--leaving' : 'attention'}
      chip={countChip(count(urgent), count(chores))}
    >
      {/* Chores share the row layout with urgent items; the badge and tint tell them apart. */}
      {urgent.length > 0 && (
        <ul className="urgent-list">
          {urgent.map((shown) => (
            <ListedRow key={shown.item.id} shown={shown} snooze={snooze} />
          ))}
        </ul>
      )}
      {chores.length > 0 && (
        <ul className="chore-row" aria-label="Chores">
          {chores.map((shown) => (
            <ListedRow key={shown.item.id} shown={shown} snooze={snooze} />
          ))}
        </ul>
      )}
      {children}
    </SectionCard>
  )
}

// A row that folds away, untouchable, once its item has left the list.
function ListedRow({
  shown: { item, leaving },
  snooze,
}: {
  shown: Shown<AttentionItem>
  snooze?: SnoozeControls
}) {
  const row = useFoldAway<HTMLLIElement>(leaving)
  return (
    <AttentionRow
      ref={row}
      inert={leaving}
      className={leaving ? 'attention-item--leaving' : undefined}
      item={item}
      snooze={snooze}
    />
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function countChip(urgent: number, chores: number) {
  const parts = [urgent > 0 && `${urgent} urgent`, chores > 0 && plural(chores, 'chore')].filter(
    Boolean,
  )
  return <Chip tone={urgent > 0 ? 'danger' : 'warn'}>{parts.join(' · ')}</Chip>
}
