import type { OnOffViewModel } from '../../../domains/onOff'
import { STATUS_TEXT } from './statusText'
import { Tile } from './Tile'

export function SwitchTile({ name, switch: sw }: { name: string; switch: OnOffViewModel }) {
  const text = sw.status !== 'ok' ? STATUS_TEXT[sw.status] : sw.isOn ? 'On' : 'Off'
  return (
    <Tile name={name} status={sw.status}>
      {text}
    </Tile>
  )
}
