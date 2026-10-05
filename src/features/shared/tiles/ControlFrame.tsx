import type { ComponentProps } from 'react'
import type { TileFrame } from './Tile'

// A control tile's list item: lit up while the entity is on, dashed when HA can't reach it.
// A tile composes it with a ControlButton and anything else it needs (a slider beneath the
// button, a control at its top right); the frame doesn't know what those are.
export function ControlFrame({
  status,
  active,
  children,
  ...rest
}: TileFrame & Omit<ComponentProps<'li'>, 'className'>) {
  return (
    <li
      {...rest}
      className="favorite-tile favorite-tile--control"
      data-status={status}
      data-active={active ? '' : undefined}
    >
      {children}
    </li>
  )
}
