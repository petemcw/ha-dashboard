import type { ReactNode } from 'react'
import { TileBody, type TileFrame, type TileLabel } from './Tile'

// A tile with nothing to press: a list item showing an entity's state.
export function DisplayTile({
  status,
  active,
  children,
  ...label
}: TileLabel & TileFrame & { children: ReactNode }) {
  return (
    <li className="favorite-tile" data-status={status} data-active={active ? '' : undefined}>
      <TileBody {...label}>{children}</TileBody>
    </li>
  )
}
