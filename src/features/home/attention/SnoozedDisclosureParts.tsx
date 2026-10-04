import { createContext, use, useId, useState, type ReactNode } from 'react'
import { formatUntil } from './snoozes'
import type { AttentionItem } from './types'

type SnoozedDisclosureValue = {
  state: { expanded: boolean; snoozed: AttentionItem[] }
  actions: {
    toggle: () => void
    // Undefined for non-admins: they see what's snoozed but can't undo it.
    unsnooze?: (id: string) => void
  }
  meta: { listId: string; until: (id: string) => Date | undefined; disabled: boolean }
}

const SnoozedDisclosureContext = createContext<SnoozedDisclosureValue | null>(null)

function useSnoozedDisclosure() {
  const value = use(SnoozedDisclosureContext)
  if (!value)
    throw new Error('SnoozedDisclosure parts need a SnoozedDisclosure.Provider above them')
  return value
}

type ProviderProps = {
  snoozed: AttentionItem[]
  until: (id: string) => Date | undefined
  onUnsnooze?: (id: string) => void
  disabled: boolean
  children: ReactNode
}

// The snoozed items and whether their list is open. It sits above both the attention card
// and the snoozed strip, so a list someone opened stays open when one gives way to the
// other.
export function SnoozedDisclosureProvider({
  snoozed,
  until,
  onUnsnooze,
  disabled,
  children,
}: ProviderProps) {
  const listId = useId()
  const [expanded, setExpanded] = useState(false)
  const value: SnoozedDisclosureValue = {
    state: { expanded, snoozed },
    actions: { toggle: () => setExpanded((open) => !open), unsnooze: onUnsnooze },
    meta: { listId, until, disabled },
  }
  return <SnoozedDisclosureContext value={value}>{children}</SnoozedDisclosureContext>
}

// "N snoozed": the count both shells show beside the toggle.
export function SnoozedCount() {
  const { snoozed } = useSnoozedDisclosure().state
  return `${snoozed.length} snoozed`
}

// The strip's one-line summary: the count, then the first snoozed item.
export function SnoozedSummary() {
  const { snoozed } = useSnoozedDisclosure().state
  return (
    <span>
      <b>
        <SnoozedCount />
      </b>
      {snoozed.length > 0 && ` · ${snoozed[0].title}`}
    </span>
  )
}

export function SnoozedToggle() {
  const { state, actions, meta } = useSnoozedDisclosure()
  return (
    <button
      type="button"
      className="button--quiet snoozed__toggle"
      aria-expanded={state.expanded}
      aria-controls={meta.listId}
      onClick={actions.toggle}
    >
      {state.expanded ? 'Hide' : 'Show'}
    </button>
  )
}

// Rendered while collapsed too, hidden, so the toggle's aria-controls always points at it.
export function SnoozedList() {
  const { state, actions, meta } = useSnoozedDisclosure()
  return (
    <ul className="snoozed__list" id={meta.listId} hidden={!state.expanded}>
      {state.snoozed.map((item) => {
        const end = meta.until(item.id)
        return (
          <li key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>
                {end ? `${item.detail} · snoozed until ${formatUntil(end)}` : item.detail}
              </span>
            </div>
            {actions.unsnooze && (
              <button
                type="button"
                className="button--quiet"
                aria-label={`Unsnooze ${item.title}`}
                disabled={meta.disabled}
                onClick={() => actions.unsnooze?.(item.id)}
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
