import { EntityTile } from '../shared/tiles/EntityTile'
import { RoomLightTile } from './RoomLightTile'

// One entity in the room card: lights get the room's own tile (drag to dim, a details sheet);
// everything else is the tile favorites show.
export function RoomTile({ entityId }: { entityId: string }) {
  return entityId.startsWith('light.') ? (
    <RoomLightTile entityId={entityId} />
  ) : (
    <EntityTile entityId={entityId} />
  )
}
