import type { OnOffViewModel } from '../../../domains/onOff'
import { STATUS_TEXT } from '../statusText'
import type { ComponentProps } from 'react'
import { ControlTile } from './ControlTile'
import type { TileControl, TileLabel } from './Tile'

// Light, switch, and fan: a toggle button. `onText` lets a light add its brightness.
export function OnOffTile({
  name,
  entity,
  onText = 'On',
  ...control
}: TileLabel & { entity: OnOffViewModel; onText?: string } & TileControl &
  Pick<ComponentProps<typeof ControlTile>, 'surface' | 'slider' | 'frame' | 'trailing'>) {
  const text = entity.status !== 'ok' ? STATUS_TEXT[entity.status] : entity.isOn ? onText : 'Off'
  return (
    // isOn is only ever true for an available entity, so it is also the lit-up state.
    <ControlTile
      name={name}
      status={entity.status}
      active={entity.isOn}
      pressed={entity.isOn}
      {...control}
    >
      {text}
    </ControlTile>
  )
}
