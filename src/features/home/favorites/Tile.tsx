import type { ReactNode } from 'react'

// Display-only in v1: a list item, not a button, with no tap action.
export function Tile({
  name,
  status,
  children,
}: {
  name: string
  status: string
  children: ReactNode
}) {
  return (
    <li className="favorite-tile" data-status={status}>
      <span className="favorite-name">{name}</span>
      <span className="favorite-state">{children}</span>
    </li>
  )
}
