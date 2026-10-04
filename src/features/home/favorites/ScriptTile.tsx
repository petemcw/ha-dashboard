import type { ScriptViewModel } from '../../../domains/script/viewModel'
import { STATUS_TEXT } from '../statusText'
import { ControlTile } from './ControlTile'
import type { TileControl, TileLabel } from './Tile'

// A run button: no `pressed`, because a script has no on/off state to toggle.
export function ScriptTile({
  name,
  script,
  ...control
}: TileLabel & { script: ScriptViewModel } & TileControl) {
  const text =
    script.status !== 'ok' ? STATUS_TEXT[script.status] : script.isRunning ? 'Running' : 'Run'
  return (
    <ControlTile
      name={name}
      status={script.status}
      active={script.status === 'ok' && script.isRunning}
      {...control}
      // While it runs, a second start would be rejected by HA's default `single` mode.
      disabled={control.disabled || script.isRunning}
    >
      {text}
    </ControlTile>
  )
}
