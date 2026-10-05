import type { ReactNode } from 'react'
import { ControlButton } from './ControlButton'
import { ControlFrame } from './ControlFrame'
import type { TileControl, TileFrame, TileLabel } from './Tile'

// A tile that is one big button: a toggle with `pressed`, a run button without. A tile that
// needs more (a slider, a details button) composes ControlFrame and ControlButton itself.
export function ControlTile({
  status,
  active,
  children,
  ...control
}: TileLabel & TileFrame & TileControl & { children: ReactNode }) {
  return (
    <ControlFrame status={status} active={active}>
      <ControlButton {...control}>{children}</ControlButton>
    </ControlFrame>
  )
}
