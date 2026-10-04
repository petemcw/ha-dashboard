import type { OnOffViewModel } from '../../../domains/onOff'
import { STATUS_TEXT } from '../statusText'
import { Tile, type TileControl, type TileLabel } from './Tile'

// Light, switch, and fan: a toggle button. `onText` lets a light add its brightness.
export function OnOffTile({
  name,
  entity,
  onText = 'On',
  ...control
}: TileLabel & { entity: OnOffViewModel; onText?: string } & TileControl) {
  const text = entity.status !== 'ok' ? STATUS_TEXT[entity.status] : entity.isOn ? onText : 'Off'
  return (
    // isOn is only ever true for an available entity, so it is also the lit-up state.
    <Tile
      name={name}
      status={entity.status}
      active={entity.isOn}
      pressed={entity.isOn}
      {...control}
    >
      {text}
    </Tile>
  )
}
