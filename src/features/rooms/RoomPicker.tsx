import { mdiAutoFix, mdiHomeOutline } from '@mdi/js'
import { Icon } from '../shared/icons/Icon'
import { iconForHa } from '../shared/icons/haIcons'
import type { RoomsModel } from './roomModel'
import type { RoomSelection } from './roomSelection'
import './RoomPicker.css'

type RoomPickerProps = {
  rooms: RoomsModel
  selection: RoomSelection
  onSelect: (selection: RoomSelection) => void
}

// One radio group so arrow keys move through every room, whichever floor it is on.
export function RoomPicker({ rooms, selection, onSelect }: RoomPickerProps) {
  const option = (key: string, icon: string, name: string, value: RoomSelection) => {
    const checked =
      selection.kind === value.kind &&
      (selection.kind === 'auto' || (value.kind === 'room' && selection.areaId === value.areaId))
    return (
      <label key={key} className="room-option">
        <input type="radio" name="room" checked={checked} onChange={() => onSelect(value)} />
        <Icon path={icon} size={22} />
        <span>{name}</span>
      </label>
    )
  }

  return (
    <div role="radiogroup" aria-label="Room" className="room-picker">
      {option('auto', mdiAutoFix, 'Auto', { kind: 'auto' })}
      {rooms.groups.map((group) => (
        <section key={group.floorId ?? 'other'} className="room-picker__floor">
          <h3>{group.name}</h3>
          {group.rooms.map((room) =>
            option(room.areaId, iconForHa(room.icon, mdiHomeOutline), room.name, {
              kind: 'room',
              areaId: room.areaId,
            }),
          )}
        </section>
      ))}
    </div>
  )
}
