import type { LightViewModel } from '../../../domains/light/viewModel'
import { STATUS_TEXT } from './statusText'
import { Tile } from './Tile'

export function LightTile({ name, light }: { name: string; light: LightViewModel }) {
  const text =
    light.status !== 'ok'
      ? STATUS_TEXT[light.status]
      : !light.isOn
        ? 'Off'
        : light.brightnessPercent === undefined
          ? 'On'
          : `On, ${light.brightnessPercent}%`
  return (
    <Tile name={name} status={light.status} active={light.status === 'ok' && light.isOn}>
      {text}
    </Tile>
  )
}
