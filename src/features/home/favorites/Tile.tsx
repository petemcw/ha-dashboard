import type { ReactNode } from 'react'

// Display-only in v1: a list item, not a button, with no tap action.
export function Tile({
  name,
  status,
  active,
  children,
}: {
  name: string
  status: string
  // On, playing, unlocked…: lit up so a glance finds what's running.
  active?: boolean
  children: ReactNode
}) {
  return (
    <li className="favorite-tile" data-status={status} data-active={active ? '' : undefined}>
      <span className="favorite-name">{name}</span>
      <span className="favorite-state">{children}</span>
    </li>
  )
}
