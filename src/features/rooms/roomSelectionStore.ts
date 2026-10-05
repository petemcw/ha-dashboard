import { createStore, type Store } from '../../infrastructure/store'
import { ROOM_SELECTION_KEY } from '../../infrastructure/storageKeys'
import type { RoomSelection } from './roomSelection'

const AUTO: RoomSelection = { kind: 'auto' }

function readSelection(): RoomSelection {
  try {
    const value = localStorage.getItem(ROOM_SELECTION_KEY)
    return value && value !== 'auto' ? { kind: 'room', areaId: value } : AUTO
  } catch {
    // Storage blocked (private mode): start on Auto.
    return AUTO
  }
}

function writeSelection(selection: RoomSelection) {
  try {
    if (selection.kind === 'auto') localStorage.removeItem(ROOM_SELECTION_KEY)
    else localStorage.setItem(ROOM_SELECTION_KEY, selection.areaId)
  } catch {
    // Storage blocked: the pick lasts until the page reloads.
  }
}

// One store for the page so the selector and the room card always agree. Read from
// localStorage on first use, not at import, so nothing touches storage before it's needed.
let store: Store<RoomSelection> | undefined
export function roomSelectionStore(): Store<RoomSelection> {
  return (store ??= createStore(readSelection()))
}

export function selectRoom(selection: RoomSelection) {
  writeSelection(selection)
  roomSelectionStore().set(selection)
}

// Tests only: forget the in-memory pick, as a reload does.
export function resetRoomSelection() {
  store = undefined
}
