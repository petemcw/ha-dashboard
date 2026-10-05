import type { ComponentProps } from 'react'
import type { LightViewModel } from '../../../domains/light/viewModel'
import { Slider } from '../Slider'
import { useSliderGesture } from '../useSliderGesture'
import { OnOffTile } from './OnOffTile'
import type { TileControl, TileLabel } from './Tile'

type LightTileProps = TileLabel & { light: LightViewModel } & TileControl &
  Pick<ComponentProps<typeof OnOffTile>, 'trailing'>

const onText = (percent: number | undefined) => (percent === undefined ? 'On' : `On, ${percent}%`)

export function LightTile({
  light,
  onDim,
  ...props
}: LightTileProps & {
  // Present only where the tile may be dragged: a room's dimmable light that isn't
  // confirm-listed.
  onDim?: (percent: number) => void
}) {
  if (onDim) return <DimmableLightTile light={light} onDim={onDim} {...props} />
  return <OnOffTile entity={light} onText={onText(light.brightnessPercent)} {...props} />
}

// The tile is its own drag surface: dragging across it sets brightness, a tap still toggles.
function DimmableLightTile({
  light,
  onDim,
  onPress,
  ...props
}: LightTileProps & { onDim: (percent: number) => void }) {
  const disabled = props.disabled || light.status !== 'ok'
  const gesture = useSliderGesture({
    value: light.isOn ? (light.brightnessPercent ?? 100) : 0,
    disabled,
    pending: props.pending,
    onCommit: onDim,
  })
  // While the value on screen is the drag's or the pending send's, the tile shows it.
  const shown = gesture.active && !disabled ? { ...light, isOn: gesture.shown > 0 } : light
  return (
    <OnOffTile
      entity={shown}
      onText={onText(gesture.active ? gesture.shown : light.brightnessPercent)}
      onPress={() => {
        if (!gesture.consumeClick()) onPress()
      }}
      surface={gesture.surface}
      frame={gesture.frame}
      slider={<Slider gesture={gesture} label={`${props.name} brightness`} disabled={disabled} />}
      {...props}
    />
  )
}
