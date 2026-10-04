import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ActionFailure } from '../../../infrastructure/serviceGateway/useAction'

// What every tile shows, control or not.
export type TileLabel = {
  name: string
  // Decorative domain icon; the name and state carry the meaning.
  icon: LucideIcon
}

// A tile that sends something. With `pressed` it's a toggle; without, a run button
// (script, scene).
export type TileControl = {
  onPress: () => void
  pressed?: boolean
  pending?: boolean
  failure?: ActionFailure | null
  disabled?: boolean
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
  icon: Icon,
  name,
  nameId,
  stateId,
  children,
}: TileLabel & { nameId?: string; stateId?: string; children: ReactNode }) {
  return (
    <>
      <Icon className="favorite-icon" aria-hidden="true" />
      <span id={nameId} className="favorite-name">
        {name}
      </span>
      <span id={stateId} className="favorite-state">
        {children}
      </span>
    </>
  )
}
