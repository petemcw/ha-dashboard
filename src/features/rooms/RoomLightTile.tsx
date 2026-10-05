import { friendlyName } from '../../domains/entityStatus'
import { setBrightness } from '../../domains/light/actions'
import { lightViewModel, type LightViewModel } from '../../domains/light/viewModel'
import { setOnOff } from '../../domains/onOffActions'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { useAction } from '../../infrastructure/serviceGateway/useAction'
import { Slider } from '../shared/Slider'
import { ControlButton } from '../shared/tiles/ControlButton'
import { ControlFrame } from '../shared/tiles/ControlFrame'
import { EntityTile } from '../shared/tiles/EntityTile'
import { entityIcon } from '../shared/tiles/entityIcon'
import { lightOnText, onOffText } from '../shared/tiles/onOffText'
import { useConfirmListed } from '../shared/tiles/useConfirmListed'
import { useSliderGesture } from '../shared/useSliderGesture'
import { LightMoreControls } from './LightDetailSheet'

const hasDetails = (light: LightViewModel) => light.supportsColorTemp || light.supportsColor

// A light in the room card. One that dims is also a slider (drag across it; a tap still
// toggles), and one with color or color temperature gets a ⋯ button for its details sheet.
// Any other light, and every confirm-listed one (never a one-gesture way in), is the same
// tile favorites show.
export function RoomLightTile({ entityId }: { entityId: string }) {
  const light = lightViewModel(entityId, useEntity(entityId))
  const confirmListed = useConfirmListed(entityId)
  if (confirmListed || (!light.canDim && !hasDetails(light))) {
    return <EntityTile entityId={entityId} />
  }
  return <AdjustableLightTile entityId={entityId} />
}

function AdjustableLightTile({ entityId }: { entityId: string }) {
  const entity = useEntity(entityId)
  const light = lightViewModel(entityId, entity)
  const name = friendlyName(entityId, entity)
  // An error clears when HA reports a new state for the light.
  const { enabled, pending, failure, run } = useAction({ clearKey: entity?.state })
  const disabled = !enabled || light.status !== 'ok'
  const gesture = useSliderGesture({
    value: light.isOn ? (light.brightnessPercent ?? 100) : 0,
    disabled,
    pending,
    onCommit: (percent) => run((gateway) => setBrightness(gateway, entityId, percent)),
  })
  const dims = light.canDim
  // While the value on screen is the drag's or the pending send's, the tile shows it.
  const shown = dims && gesture.active && !disabled ? { ...light, isOn: gesture.shown > 0 } : light
  const percent = dims && gesture.active ? gesture.shown : light.brightnessPercent
  return (
    // A dimming tile is the slider's frame: it stretches when dragged past an end.
    <ControlFrame
      status={light.status}
      active={shown.isOn}
      {...(dims ? { 'data-draggable': '', ...gesture.frame } : {})}
    >
      {dims && <Slider gesture={gesture} label={`${name} brightness`} disabled={disabled} />}
      <ControlButton
        name={name}
        icon={entityIcon(entityId, entity)}
        pressed={shown.isOn}
        pending={pending}
        failure={failure}
        disabled={disabled}
        // Sends the opposite of what HA reports, never a toggle. The click that ends a drag
        // isn't a tap.
        onPress={() => {
          if (!gesture.consumeClick()) run((gateway) => setOnOff(gateway, entityId, !light.isOn))
        }}
        {...(dims ? gesture.surface : {})}
      >
        {onOffText(shown, lightOnText(percent))}
      </ControlButton>
      {hasDetails(light) && (
        <div className="favorite-trailing">
          <LightMoreControls entityId={entityId} name={name} />
        </div>
      )}
    </ControlFrame>
  )
}
