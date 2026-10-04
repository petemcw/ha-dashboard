import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { foldAway } from '../../shared/motion'
import { LEAVE_MS } from '../../shared/useLeavingItems'
import { useAttentionAction } from './AttentionAction'
import { ActionGlyph, BadgeGlyph } from './attentionIcons'
import { SnoozeMenu } from './SnoozeMenu'
import type { ActionIcon, AttentionItem, RunnableAction } from './types'
import type { SnoozeDuration } from './useSnoozes'

type SnoozeControls = {
  disabled: boolean
  onSnooze: (id: string, duration: SnoozeDuration) => void
}

// `leaving`: the item has resolved and the row is folding away; it takes no input.
type Props = { item: AttentionItem; snooze?: SnoozeControls; leaving?: boolean }

// One row per item: badge, text, then the action and snooze on the right. The failure
// line spans the row underneath. Undefined `snooze` means this user gets no snooze action.
export function AttentionRow({ item, snooze, leaving }: Props) {
  const { action } = item
  if (action && !('href' in action))
    return <RunnableRow item={item} action={action} snooze={snooze} leaving={leaving} />
  return (
    <RowLayout
      item={item}
      snooze={snooze}
      leaving={leaving}
      control={action && <ReorderLink action={action} />}
    />
  )
}

function RunnableRow({ item, action, snooze, leaving }: Props & { action: RunnableAction }) {
  const { control, failure } = useAttentionAction(action)
  return (
    <RowLayout item={item} snooze={snooze} leaving={leaving} control={control} failure={failure} />
  )
}

// Links don't change devices; everything else goes through the gateway.
function ReorderLink({ action }: { action: { label: string; icon: ActionIcon; href: string } }) {
  return (
    <a
      className="button-link"
      href={action.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={action.label}
    >
      <ActionGlyph name={action.icon} />
    </a>
  )
}

function RowLayout({
  item,
  snooze,
  leaving,
  control,
  failure,
}: Props & { control?: ReactNode; failure?: ReactNode }) {
  const row = useRef<HTMLLIElement>(null)
  // Before paint, so the first leaving frame is already the start of the fold.
  useLayoutEffect(() => {
    if (leaving && row.current) foldAway(row.current, LEAVE_MS)
  }, [leaving])
  return (
    <li
      ref={row}
      inert={leaving}
      className={`attention-item attention-item--${item.tier}${leaving ? ' attention-item--leaving' : ''}`}
    >
      <span className="attention-item__badge">
        <BadgeGlyph item={item} />
      </span>
      <div className="attention-item__text">
        <strong className="attention-item__title">{item.title}</strong>
        {item.detail && <span className="attention-item__detail">{item.detail}</span>}
      </div>
      <div className="attention-item__actions">
        {control}
        {snooze && (
          <SnoozeMenu
            title={item.title}
            disabled={snooze.disabled}
            onChoose={(d) => snooze.onSnooze(item.id, d)}
          />
        )}
      </div>
      {failure}
    </li>
  )
}
