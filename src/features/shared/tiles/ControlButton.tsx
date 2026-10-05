import { useId, type ComponentProps, type ReactNode } from 'react'
import { ActionButton } from '../ActionButton'
import { ActionError } from '../ActionError'
import { ConfirmAnnouncement } from '../ConfirmAnnouncement'
import { useConfirmArm } from '../useConfirmArm'
import { TileBody, type TileControl, type TileLabel } from './Tile'

// The tile-filling button inside a ControlFrame: a toggle with `pressed`, a run button
// without. Pointer handlers pass through, so a tile can make the button its drag surface.
export function ControlButton({
  name,
  icon,
  children,
  onPress,
  pressed,
  pending,
  failure = null,
  disabled,
  confirm,
  ...pointer
}: TileLabel &
  TileControl &
  Pick<
    ComponentProps<'button'>,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
  > & { children: ReactNode }) {
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
  const confirmName = confirm ? `Confirm: ${confirm.action}` : undefined
  return (
    <>
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
        {...pointer}
      >
        <TileBody name={name} icon={icon} nameId={nameId} stateId={stateId}>
          {armed ? 'Confirm?' : children}
        </TileBody>
      </ActionButton>
      {/* Only on confirm-listed tiles, so other tiles add no live region. */}
      {confirm && <ConfirmAnnouncement text={armed ? (confirmName ?? '') : ''} />}
      <ActionError failure={failure} />
    </>
  )
}
