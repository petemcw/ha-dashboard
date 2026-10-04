import type { LightViewModel } from '../../../domains/light/viewModel'
import { OnOffTile } from './OnOffTile'
import type { TileControl, TileLabel } from './Tile'

export function LightTile({
  light,
  ...props
}: TileLabel & { light: LightViewModel } & TileControl) {
  const onText = light.brightnessPercent === undefined ? 'On' : `On, ${light.brightnessPercent}%`
  return <OnOffTile entity={light} onText={onText} {...props} />
}
