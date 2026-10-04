import { useState } from 'react'
import { canAnimate } from '../../shared/motion'
import { UndoNotice } from '../../shared/UndoNotice'
import { useLeavingItems } from '../../shared/useLeavingItems'
import { AttentionCard } from './AttentionCard'
import { SnoozedDisclosure } from './SnoozedDisclosure'
import { SnoozedStrip } from './SnoozedStrip'
import { formatUntil } from './snoozes'
import type { AttentionItem } from './types'
import type { Attention } from './useAttention'
import './AttentionSection.css'

// Needs attention: the card while anything needs it, otherwise the snoozed strip if
// anything is snoozed, otherwise nothing. Owns what outlives either shell: the snoozed
// list's open state, the rows still folding away, and the Undo for a snooze.
export function AttentionSection({ attention }: { attention: Attention }) {
  const { urgent, chores, snoozed, snoozing } = attention
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
  // Here, not in the card, so the card stays up while its last row folds away.
  const animate = canAnimate()
  const shownUrgent = useLeavingItems(urgent, itemKey, animate)
  const shownChores = useLeavingItems(chores, itemKey, animate)
  // The card and the strip never both show, so they never both show the failure.
  const status = <SnoozeStatus readable={snoozing.readable} error={snoozing.error} />

  return (
    <SnoozedDisclosure.Provider
      snoozed={snoozed}
      until={snoozing.until}
      onUnsnooze={snoozing.canSnooze ? snoozing.unsnooze : undefined}
      disabled={snoozing.pending}
    >
      {shownUrgent.length + shownChores.length > 0 ? (
        <AttentionCard urgent={shownUrgent} chores={shownChores} snooze={snooze}>
          {snoozed.length > 0 && (
            <div className="snoozed__foot">
              <span>
                <SnoozedDisclosure.Count />
              </span>
              <SnoozedDisclosure.Toggle />
            </div>
          )}
          <SnoozedDisclosure.List />
          {status}
        </AttentionCard>
      ) : (
        snoozed.length > 0 && (
          <SnoozedStrip>
            <SnoozedDisclosure.List />
            {status}
          </SnoozedStrip>
        )
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
    </SnoozedDisclosure.Provider>
  )
}

function SnoozeStatus({ readable, error }: { readable: boolean; error?: string }) {
  return (
    <>
      {!readable && <p role="status">Snoozes are unavailable.</p>}
      {error && <p role="alert">{error}</p>}
    </>
  )
}

const itemKey = (item: AttentionItem) => item.id
