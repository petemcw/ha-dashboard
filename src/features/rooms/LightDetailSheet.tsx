import { mdiDotsHorizontal } from '@mdi/js'
import { useState } from 'react'
import { setBrightness, setColor, setColorTemp } from '../../domains/light/actions'
import { lightViewModel, type LightViewModel } from '../../domains/light/viewModel'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { useAction, type ActionState } from '../../infrastructure/serviceGateway/useAction'
import { ActionError } from '../shared/ActionError'
import { BottomSheet } from '../shared/BottomSheet'
import { Icon } from '../shared/icons/Icon'
import { SliderTrack } from '../shared/Slider'
import { fromPercent, toPercent, type SliderScale } from '../shared/sliderScale'
import { useSliderGesture } from '../shared/useSliderGesture'
import './LightDetailSheet.css'

// The visible ⋯ button on a light's room tile, and the sheet it opens. It sits beside the
// tile's button, never inside it, so pressing it can't start a drag or toggle the light.
export function LightMoreControls({ entityId, name }: { entityId: string; name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="favorite-more"
        aria-label={`More controls for ${name}`}
        onClick={() => setOpen(true)}
      >
        <Icon path={mdiDotsHorizontal} />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={name}>
        <LightDetailControls entityId={entityId} name={name} />
      </BottomSheet>
    </>
  )
}

type Swatch = { name: string; hs: [number, number] }

// Colors only: warm white is the temperature slider's job.
const SWATCHES: Swatch[] = [
  { name: 'Red', hs: [0, 100] },
  { name: 'Orange', hs: [30, 100] },
  { name: 'Yellow', hs: [55, 100] },
  { name: 'Green', hs: [120, 100] },
  { name: 'Cyan', hs: [180, 100] },
  { name: 'Blue', hs: [240, 100] },
  { name: 'Purple', hs: [280, 100] },
  { name: 'Pink', hs: [330, 100] },
]

// Hue wraps around: 350 is 10 degrees from red (0), not 340 from it.
const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

const nearestSwatch = ([hue]: [number, number]) =>
  SWATCHES.reduce((best, swatch) =>
    hueDistance(swatch.hs[0], hue) < hueDistance(best.hs[0], hue) ? swatch : best,
  )

type ControlProps = {
  entityId: string
  name: string
  light: LightViewModel
  disabled: boolean
  pending: boolean
  run: ActionState['run']
}

// Each slider owns its gesture, so a drag re-renders that slider alone, not the whole sheet.
function BrightnessControl({ entityId, name, light, disabled, pending, run }: ControlProps) {
  const gesture = useSliderGesture({
    value: light.brightnessPercent ?? 0,
    disabled,
    pending,
    onCommit: (percent) => run((gateway) => setBrightness(gateway, entityId, percent)),
  })
  return <SliderTrack gesture={gesture} label={`${name} brightness`} disabled={disabled} />
}

function ColorTempControl({ entityId, name, light, disabled, pending, run }: ControlProps) {
  const scale: SliderScale = { ...light.kelvinRange, unit: 'K' }
  const gesture = useSliderGesture({
    value: toPercent(scale, light.colorTempKelvin ?? Math.round((scale.min + scale.max) / 2)),
    disabled,
    pending,
    onCommit: (percent) =>
      run((gateway) => setColorTemp(gateway, entityId, fromPercent(scale, percent))),
  })
  return (
    <SliderTrack
      gesture={gesture}
      label={`${name} color temperature`}
      disabled={disabled}
      scale={scale}
      restingValue={light.colorTempKelvin}
      valueText={
        light.colorTempKelvin === undefined ? (light.isOn ? 'Not set' : 'Light is off') : undefined
      }
    />
  )
}

function LightDetailControls({ entityId, name }: { entityId: string; name: string }) {
  const entity = useEntity(entityId)
  const light = lightViewModel(entityId, entity)
  const { enabled, pending, failure, run } = useAction({ clearKey: entity?.state })
  const disabled = !enabled || light.status !== 'ok'
  const control = { entityId, name, light, disabled, pending, run }
  const activeSwatch = light.hsColor && nearestSwatch(light.hsColor)
  return (
    <div className="light-detail">
      {light.canDim && <BrightnessControl {...control} />}
      {light.supportsColorTemp && <ColorTempControl {...control} />}
      {light.supportsColor && (
        <div className="swatches" role="group" aria-label={`${name} color`}>
          {SWATCHES.map((swatch) => (
            <button
              key={swatch.name}
              type="button"
              className="swatch"
              style={{ background: `hsl(${swatch.hs[0]} ${swatch.hs[1]}% 50%)` }}
              aria-label={swatch.name}
              aria-pressed={swatch === activeSwatch}
              disabled={disabled}
              onClick={() => run((gateway) => setColor(gateway, entityId, swatch.hs))}
            />
          ))}
        </div>
      )}
      <ActionError failure={failure} />
    </div>
  )
}
