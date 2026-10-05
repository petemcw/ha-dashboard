import { useId, type ComponentProps, type ReactNode } from 'react'
import { ActionButton } from '../ActionButton'
import { ActionError } from '../ActionError'
import { ConfirmAnnouncement } from '../ConfirmAnnouncement'
import { useConfirmArm } from '../useConfirmArm'
import type { SliderGesture } from '../useSliderGesture'
import { TileBody, type TileControl, type TileFrame, type TileLabel } from './Tile'

// A tile that is one big button: a toggle with `pressed`, a run button without.
export function ControlTile({
  status,
  active,
  children,
  onPress,
  pressed,
  pending,
  failure = null,
  disabled,
  confirm,
  surface,
  slider,
  frame,
  trailing,
  ...label
}: TileLabel &
  TileFrame &
  TileControl & {
    children: ReactNode
    // Pointer handlers that make the button a drag surface (a dimmable light).
    surface?: Pick<
      ComponentProps<'button'>,
      'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
    >
    // A slider laid over the tile, as a sibling of the button (nothing interactive can sit
    // inside it).
    slider?: ReactNode
    // The slider's frame props: the tile is what stretches when dragged past an end.
    frame?: SliderGesture['frame']
    // A control at the tile's top right, beside the button (the light's details button).
    trailing?: ReactNode
  }) {
  const id = useId()
  const nameId = `${id}-name`
  const stateId = `${id}-state`
  const {
    armed,
    onPress: press,
    buttonProps,
  } = useConfirmArm({
    disabled,
    onConfirm: onPress,
    required: confirm !== undefined,
  })
  const confirmName = confirm ? `Confirm: ${confirm.action} ${label.name}` : undefined
  return (
    <li
      {...frame}
      className="favorite-tile favorite-tile--control"
      data-status={status}
      data-active={active ? '' : undefined}
      data-draggable={surface ? '' : undefined}
    >
      {slider}
      {/* The name is the button's name and the state its description, so a toggle's name
          doesn't change when it flips. Armed, the name spells out what a second tap does and
          the state slot reads "Confirm?". */}
      <ActionButton
        className="favorite-button"
        aria-labelledby={armed ? undefined : nameId}
        aria-label={armed ? confirmName : undefined}
        aria-describedby={armed ? undefined : stateId}
        aria-pressed={pressed}
        disabled={disabled}
        pending={pending}
        onPress={press}
        {...buttonProps}
        {...surface}
      >
        <TileBody {...label} nameId={nameId} stateId={stateId}>
          {armed ? 'Confirm?' : children}
        </TileBody>
      </ActionButton>
      {/* Only on confirm-listed tiles, so other tiles add no live region. */}
      {confirm && <ConfirmAnnouncement text={armed ? (confirmName ?? '') : ''} />}
      {trailing && <div className="favorite-trailing">{trailing}</div>}
      <ActionError failure={failure} />
    </li>
  )
}
