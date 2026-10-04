import type { SceneViewModel } from '../../../domains/scene/viewModel'
import { STATUS_TEXT } from '../statusText'
import { Tile, type TileControl, type TileLabel } from './Tile'

// A run button: no `pressed`. The scene's state is its last activation time, so the
// tile shows "Activate" rather than a state.
export function SceneTile({
  name,
  scene,
  ...control
}: TileLabel & { scene: SceneViewModel } & TileControl) {
  return (
    <Tile name={name} status={scene.status} {...control}>
      {scene.status !== 'ok' ? STATUS_TEXT[scene.status] : 'Activate'}
    </Tile>
  )
}
