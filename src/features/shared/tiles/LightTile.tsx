import type { LightViewModel } from '../../../domains/light/viewModel'
import { lightOnText } from './onOffText'
import { OnOffTile } from './OnOffTile'
import type { TileControl, TileLabel } from './Tile'

// A light toggles like a switch, and says how bright it is while on.
export function LightTile({
  light,
  ...props
}: TileLabel & { light: LightViewModel } & TileControl) {
  return <OnOffTile entity={light} onText={lightOnText(light.brightnessPercent)} {...props} />
}
