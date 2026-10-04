import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useAttentionAction } from './AttentionAction'
import { ActionGlyph, BadgeGlyph } from './attentionIcons'
import { SnoozeMenu } from './SnoozeMenu'
import type { ActionIcon, AttentionItem, RunnableAction } from './types'
import type { SnoozeDuration } from './useSnoozes'

export type SnoozeControls = {
  disabled: boolean
  onSnooze: (id: string, duration: SnoozeDuration) => void
}

type Props = { item: AttentionItem; snooze?: SnoozeControls }

// One row per item: badge, text, then the action and snooze on the right. The failure
// line spans the row underneath. Undefined `snooze` means this user gets no snooze action.
// Other <li> attributes (a ref, inert, a class) go straight onto the row, so a list can
// animate or disable its rows without the row knowing why.
export function AttentionRow({
  item,
  snooze,
  className,
  ...li
}: Props & Omit<ComponentPropsWithRef<'li'>, 'children'>) {
  const { action } = item
  return (
    <li
      {...li}
      className={['attention-item', `attention-item--${item.tier}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {action && !('href' in action) ? (
        <RunnableRowContent item={item} action={action} snooze={snooze} />
      ) : (
        <RowContent
          item={item}
          snooze={snooze}
          control={action && <ReorderLink action={action} />}
        />
      )}
    </li>
  )
}

function RunnableRowContent({ item, action, snooze }: Props & { action: RunnableAction }) {
  const { control, failure } = useAttentionAction(action)
  return <RowContent item={item} snooze={snooze} control={control} failure={failure} />
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

function RowContent({
  item,
  snooze,
  control,
  failure,
}: Props & { control?: ReactNode; failure?: ReactNode }) {
  return (
    <>
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
    </>
  )
}
