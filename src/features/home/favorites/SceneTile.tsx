import type { SceneViewModel } from '../../../domains/scene/viewModel'
import { STATUS_TEXT } from '../statusText'
import { ControlTile } from './ControlTile'
import type { TileControl, TileLabel } from './Tile'

// A run button: no `pressed`. The scene's state is its last activation time, so the
// tile shows "Activate" rather than a state.
export function SceneTile({
  name,
  scene,
  ...control
}: TileLabel & { scene: SceneViewModel } & TileControl) {
  return (
    <ControlTile name={name} status={scene.status} {...control}>
      {scene.status !== 'ok' ? STATUS_TEXT[scene.status] : 'Activate'}
    </ControlTile>
  )
}
