import { useId, type ReactNode } from 'react'
import { ActionButton } from '../../shared/ActionButton'
import { ActionError } from '../../shared/ActionError'
import { TileBody, type TileControl, type TileFrame, type TileLabel } from './Tile'

// A tile that is one big button: a toggle with `pressed`, a run button without.
export function ControlTile({
  status,
  active,
  children,
  onPress,
  pressed,
  pending,
  failure = null,
  disabled,
  ...label
}: TileLabel & TileFrame & TileControl & { children: ReactNode }) {
  const id = useId()
  const nameId = `${id}-name`
  const stateId = `${id}-state`
  return (
    <li
      className="favorite-tile favorite-tile--control"
      data-status={status}
      data-active={active ? '' : undefined}
    >
      {/* The name is the button's name and the state its description, so a toggle's name
          doesn't change when it flips. */}
      <ActionButton
        className="favorite-button"
        aria-labelledby={nameId}
        aria-describedby={stateId}
        aria-pressed={pressed}
        disabled={disabled}
        pending={pending}
        onPress={onPress}
      >
        <TileBody {...label} nameId={nameId} stateId={stateId}>
          {children}
        </TileBody>
      </ActionButton>
      <ActionError failure={failure} />
    </li>
  )
}
