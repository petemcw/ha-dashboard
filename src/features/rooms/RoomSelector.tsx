import { useState } from 'react'
import { mdiChevronDown } from '@mdi/js'
import { BottomSheet } from '../shared/BottomSheet'
import { Icon } from '../shared/icons/Icon'
import { RoomPicker } from './RoomPicker'
import { useSelectedRoom } from './useSelectedRoom'
import './RoomSelector.css'

// Says what Home is showing: the pick, or under Auto the room Auto chose and why. Tapping
// it opens the picker.
export function RoomSelector() {
  const { rooms, resolved, select } = useSelectedRoom()
  const [open, setOpen] = useState(false)
  // A house with no rooms has nothing to choose between.
  if (!resolved || !rooms || rooms.groups.length === 0) return null

  const auto = resolved.selection.kind === 'auto'
  const showing = resolved.kind === 'room' ? resolved.room.name : undefined
  const reason = resolved.kind === 'room' ? resolved.reason : undefined
  const text = auto
    ? ['Room · Auto', showing && `${showing}${reason ? `, ${reason}` : ''}`]
    : ['Room', showing]
  // Screen readers hear what Auto picked too, in a sentence rather than the dotted label.
  const speech = auto
    ? `Room: Auto${showing ? `, showing ${showing}${reason ? ` because ${reason}` : ''}` : ''}`
    : `Room: ${showing}`

  return (
    <>
      <button
        type="button"
        className="room-selector"
        aria-label={speech}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span>{text.filter(Boolean).join(' · ')}</span>
        <Icon path={mdiChevronDown} size={20} />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Room">
        <RoomPicker
          rooms={rooms}
          selection={resolved.selection}
          onSelect={(selection) => {
            select(selection)
            setOpen(false)
          }}
        />
      </BottomSheet>
    </>
  )
}
