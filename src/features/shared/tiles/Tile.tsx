import type { ReactNode } from 'react'
import { Icon } from '../icons/Icon'
import type { ActionFailure } from '../../../infrastructure/serviceGateway/useAction'
import type { Confirm } from '../useConfirmArm'

// What every tile shows, control or not.
export type TileLabel = {
  name: string
  // Decorative domain icon; the name and state carry the meaning.
  // An MDI path.
  icon: string
}

// A tile that sends something. With `pressed` it's a toggle; without, a run button
// (script, scene).
export type TileControl = {
  onPress: () => void
  pressed?: boolean
  pending?: boolean
  failure?: ActionFailure | null
  disabled?: boolean
  // Set for a confirm-listed entity, so the first tap arms and only the second sends.
  confirm?: Confirm
}

// The list item's look, shared by both kinds of tile.
export type TileFrame = {
  status: string
  // On, playing, unlocked…: lit up so a glance finds what's running.
  active?: boolean
}

// Icon, name, and state: the contents of every tile. The ids let a control tile name
// itself after the name and describe itself with the state.
export function TileBody({
  icon,
  name,
  nameId,
  stateId,
  children,
}: TileLabel & { nameId?: string; stateId?: string; children: ReactNode }) {
  return (
    <>
      <Icon path={icon} className="favorite-icon" />
      <span id={nameId} className="favorite-name">
        {name}
      </span>
      <span id={stateId} className="favorite-state">
        {children}
      </span>
    </>
  )
}
