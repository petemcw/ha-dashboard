import type { LucideIcon } from 'lucide-react'
import type { StateViewModel } from '../../../domains/generic/viewModel'
import { STATUS_TEXT } from '../statusText'
import { Tile } from './Tile'

// Display-only domains (media_player, cover, climate, lock…): HA's own state text.
export function StateTile({
  name,
  entity,
  icon,
}: {
  name: string
  entity: StateViewModel
  icon: LucideIcon
}) {
  return (
    <Tile name={name} status={entity.status} icon={icon}>
      {entity.status === 'ok' ? entity.state : STATUS_TEXT[entity.status]}
    </Tile>
  )
}
