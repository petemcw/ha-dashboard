# Task 009: Room Selection and Room Sources

**Status**: completed
**Issue**: #53
**Depends on**: 006, 007
**Retry count**: 0

## Description

Remember the room picked on this device (Auto or an area), and resolve it to the room to show. Auto runs a list of room sources in order behind a small interface, so occupancy, UniFi, or BLE sources can be added later without touching the UI. The one source now is the away source: when the signed-in person isn't home, show the `home.json` away room.

## Context

- Related files: new `src/features/rooms/roomSelection.ts` (pure resolver + types), `src/features/rooms/roomSources.ts` (interface and `awaySource`), `src/features/rooms/roomSelectionStore.ts`, `src/features/rooms/useSelectedRoom.ts`, `src/infrastructure/storageKeys.ts` (`ROOM_SELECTION_KEY = 'ha-dashboard:room'`), `src/infrastructure/store.ts` (`createStore`), `src/infrastructure/ha/useCurrentUser.ts`, `src/infrastructure/ha/connection.ts` (`isKioskDevice`), `src/domains/person/` (`types.ts`, `viewModel.ts`, factories).
- Types (from planning):

  ```ts
  type RoomSelection = { kind: 'auto' } | { kind: 'room'; areaId: string }
  type RoomPick = { areaId: string; reason: string }
  type RoomSourceContext = {
    rooms: RoomsModel
    awayRoom?: string
    currentUserId?: string
    persons: PersonViewModel[]
    kiosk: boolean
  }
  type RoomSource = { id: string; resolve(ctx: RoomSourceContext): RoomPick | undefined }
  type ResolvedRoom =
    | { kind: 'none'; selection: RoomSelection }
    | { kind: 'room'; selection: RoomSelection; room: Room; reason?: string } // reason only for Auto
  ```

- Resolution: a manual pick whose area is a current room wins. A manual pick whose area isn't a room (deleted, hidden, emptied) resolves as Auto. Auto takes the first source pick whose area is a current room; otherwise `none`.
- **Persons.** There is no `PersonState` type and no person hook today. Add `userId?: string` to `PersonViewModel` (from the `user_id` attribute; `personViewModel` maps it) and read persons the way `PresenceRow` does: `useEntityIds(isPerson)` with a module-constant predicate, then `useEntitiesById`. Don't subscribe to every entity.
- `awaySource`: find the person whose `userId` equals the current user's id. If its presence is anything other than `home` (and not `unknown`/`unavailable`/`missing`), pick (a named zone such as Work counts as away, decided with the owner: matches the old dashboard's "not home" rule) `awayRoom` with reason "you're away". No person for the user → no pick. No `awayRoom` configured → no pick. **`kiosk` true → no pick**, whatever user the kiosk token belongs to: "the kiosk never shows the away room" must not depend on the kiosk token having been made from an account with no person.
- **One shared selection.** The selector (010) and the room card (012) are separate components that both call `useSelectedRoom()`. Keep the selection in one module-level store (`createStore` in `roomSelectionStore.ts`), initialized from localStorage on first read, so a pick in the selector reaches the card at once. Don't hold it in per-component `useState`.
- Persistence: per device in localStorage, stored as `'auto'` or the area id; absent means Auto. Wrap reads and writes in try/catch (private mode, as `useThemePreference` does); a storage failure falls back to Auto in memory. A pick stays until changed (no expiry). Export a test-only reset for the store.
- `useSelectedRoom()` returns `{ resolved, select(selection) }`; `resolved` is `undefined` while `useRooms()` is `undefined` (loading or error), so callers render nothing.

## Requirements (Test Descriptions)

- [x] `it shows the picked room when the pick is a current room`
- [x] `it treats a pick whose area is no longer a room as Auto`
- [x] `it shows the away room under Auto when the signed-in person is not home`
- [x] `it shows no room under Auto when the signed-in person is home or has unknown presence`
- [x] `it shows no room under Auto when the signed-in user has no person`
- [x] `it shows no room under Auto when no away room is configured`
- [x] `it shows no room under Auto on a kiosk even when the signed-in user's person is away`
- [x] `it remembers the pick on this device across a reload and defaults to Auto`
- [x] `it shows a pick made through one useSelectedRoom caller to every other caller`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes
Added `roomSelection.ts` (pure `resolveRoom`), `roomSources.ts` (`awaySource`, kiosk never picks), `roomSelectionStore.ts` (lazy module store, localStorage under `ROOM_SELECTION_KEY`, `resetRoomSelection` for tests), `useSelectedRoom.ts`; `PersonViewModel.userId`. Tests: `roomSelection.test.ts` (resolver and sources), `useSelectedRoom.test.tsx` (persistence, sharing, storage failure, loading). `useCurrentUser` is mocked in the hook test (connection edge). Full suite: only `SectionCard.test.tsx` fails (task 002/003 in-progress edit).
