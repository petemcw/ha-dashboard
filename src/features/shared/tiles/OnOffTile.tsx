import type { OnOffViewModel } from '../../../domains/onOff'
import { ControlTile } from './ControlTile'
import { onOffText } from './onOffText'
import type { TileControl, TileLabel } from './Tile'

// Light, switch, and fan: a toggle button. `onText` lets a light add its brightness.
export function OnOffTile({
  entity,
  onText,
  ...control
}: TileLabel & { entity: OnOffViewModel; onText?: string } & TileControl) {
  return (
    // isOn is only ever true for an available entity, so it is also the lit-up state.
    <ControlTile status={entity.status} active={entity.isOn} pressed={entity.isOn} {...control}>
      {onOffText(entity, onText)}
    </ControlTile>
  )
}
