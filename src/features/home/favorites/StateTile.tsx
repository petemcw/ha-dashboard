import type { StateViewModel } from '../../../domains/generic/viewModel'
import { STATUS_TEXT } from './statusText'
import { Tile } from './Tile'

// Display-only domains (media_player, cover, climate, lock…): HA's own state text.
export function StateTile({ name, entity }: { name: string; entity: StateViewModel }) {
  return (
    <Tile name={name} status={entity.status}>
      {entity.status === 'ok' ? entity.state : STATUS_TEXT[entity.status]}
    </Tile>
  )
}
