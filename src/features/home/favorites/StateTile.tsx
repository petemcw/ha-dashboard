import type { StateViewModel } from '../../../domains/generic/viewModel'
import { STATUS_TEXT } from '../statusText'
import { DisplayTile } from './DisplayTile'
import type { TileLabel } from './Tile'

// Display-only domains (media_player, cover, climate, lock…): HA's own state text.
export function StateTile({ name, entity, icon }: TileLabel & { entity: StateViewModel }) {
  return (
    <DisplayTile name={name} status={entity.status} icon={icon}>
      {entity.status === 'ok' ? entity.state : STATUS_TEXT[entity.status]}
    </DisplayTile>
  )
}
