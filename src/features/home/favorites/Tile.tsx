import { useId, type ReactNode } from 'react'
import type { ActionFailure } from '../../../infrastructure/serviceGateway/useAction'
import { ActionButton } from '../../shared/ActionButton'
import { ActionError } from '../../shared/ActionError'

export type TileControl = {
  // No onPress: display-only list item. With onPress and `pressed`: a toggle button.
  // With onPress and no `pressed`: a run button (script, scene).
  onPress?: () => void
  pressed?: boolean
  pending?: boolean
  failure?: ActionFailure | null
  disabled?: boolean
}

type TileProps = TileControl & {
  name: string
  status: string
  // On, playing, unlocked…: lit up so a glance finds what's running.
  active?: boolean
  children: ReactNode
}

export function Tile({
  name,
  status,
  active,
  children,
  onPress,
  pressed,
  pending,
  failure = null,
  disabled,
}: TileProps) {
  const id = useId()
  const nameId = `${id}-name`
  const stateId = `${id}-state`
  const nameEl = (
    <span id={nameId} className="favorite-name">
      {name}
    </span>
  )
  const stateEl = (
    <span id={stateId} className="favorite-state">
      {children}
    </span>
  )
  return (
    <li
      className="favorite-tile"
      data-status={status}
      data-active={active ? '' : undefined}
      data-pending={pending ? '' : undefined}
      data-interactive={onPress ? '' : undefined}
    >
      {onPress ? (
        <>
          {/* The name is the button's name and the state its description, so a toggle's
              name doesn't change when it flips. */}
          <ActionButton
            className="favorite-button"
            aria-labelledby={nameId}
            aria-describedby={stateId}
            aria-pressed={pressed}
            disabled={disabled}
            pending={pending}
            onPress={onPress}
          >
            {nameEl}
            {stateEl}
          </ActionButton>
          <ActionError failure={failure} />
        </>
      ) : (
        <>
          {nameEl}
          {stateEl}
        </>
      )}
    </li>
  )
}
