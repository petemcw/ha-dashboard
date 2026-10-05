# Task 012: Room Card on Home

**Status**: completed
**Issue**: #58
**Depends on**: 010, 011, 013
**Retry count**: 0

## Description

Show the resolved room as a card right after Suggestions: the room's icon and name in the header, its temperature and humidity when the area names those sensors, and a tile grid of its entities through the shared `EntityTile` with `variant="room"`. The confirm list (013) is already in `EntityTile`, so a confirm-listed room tile needs two taps from the first build. No card when nothing is resolved. Media players appear as display-only tiles here; 016 replaces them with player rows.

## Context

- Related files: new `src/features/rooms/RoomCard.tsx` (+ CSS, test), `src/features/home/HomeScreen.tsx` (new `home__order--room` wrapper after suggestions in column 1), `src/styles/layout.css` (phone order: selector, attention, suggestions, room, favorites, …), `src/features/home/SectionCard.tsx`, `src/features/shared/tiles/EntityTile.tsx` (011), `useSelectedRoom` (009), `e2e/rooms.spec.ts`.
- Card region is named by the room name (`SectionCard` title), so `getByRole('region', { name: 'Kitchen' })` works in specs. Header chip: temperature and humidity read from `temperatureEntityId` / `humidityEntityId` through the sensor view model, formatted with their units; `unavailable`/`missing` show as such, never a guess.
- Covers, climate, and locks render as display-only `StateTile`s (decided: no controls this plan).
- A room whose resolved entities are all missing still renders, with missing tiles (principle 12). An empty room can't be resolved (007 drops it).
- Phone order: renumber the `.home__order--*` values so the order is selector, attention, suggestions, room, favorites, today, systems, media, crypto, and add `.home__order--room` to the tablet rule that resets `order: 0`. `e2e/home.spec.ts` compares boxes, not order numbers, and its house has no rooms (019's empty default registries), so it should pass unchanged; the room card's phone order check goes in `e2e/rooms.spec.ts`.
- Playwright (`e2e/rooms.spec.ts`, with 019's placeholder registries): pick a placeholder room and toggle a light through the fake HA; check the card's position after Suggestions at phone and tablet; check the placeholder garage opener (in `testHomeConfig.confirm`) needs two taps in the room card; screenshots.

## Requirements (Test Descriptions)

- [x] `it shows the resolved room as a card named by the room after Suggestions`
- [x] `it shows no room card when nothing is resolved`
- [x] `it shows the room's temperature and humidity in the card header when the area has them`
- [x] `it renders a tile for every entity in the room in the room's order`
- [x] `it toggles a light in the room card through the fake HA`
- [x] `it shows covers, climate, and locks without controls`
- [x] `it asks for a second tap on a confirm-listed room tile`

## Acceptance Criteria

- All requirements have passing tests
- Screenshots checked at phone and tablet, light and dark
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `RoomCard` (`src/features/rooms/RoomCard.tsx`, `.css`) uses `useSelectedRoom`, renders null unless a room resolved, and puts `EntityTile variant="room"` for each `room.entityIds`. Header readings use `sensorViewModel` (now with a `unit` field).
- Layout: `home__order--room` after suggestions; `layout.css` renumbered and the tablet reset updated.
- Tests for toggle, display-only tiles, and confirm passed immediately at the card level because EntityTile (011/013) already did the work. The e2e garage-opener spec added a garage room to `e2e/rooms.spec.ts`, so the picker now also shows an `Other` group there.
