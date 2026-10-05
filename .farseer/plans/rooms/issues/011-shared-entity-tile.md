# Task 011: Shared Entity Tile with Helpers

**Status**: completed
**Issue**: #54
**Depends on**: 003
**Retry count**: 0

## Description

Pre-factor: lift `FavoriteTile`'s per-domain dispatch into a shared `EntityTile` that both favorites and the room card use, and add `input_boolean` as an on/off kind (domain action, favorites editor; the fake HA side is 019). Favorites behave exactly as before.

## Context

- Related files: `src/features/home/favorites/FavoriteTile.tsx`, `LightTile.tsx`, `OnOffTile.tsx`, `SceneTile.tsx`, `ScriptTile.tsx`, `StateTile.tsx`, `Tile.tsx`, `favoriteIcon.ts` → new `src/features/shared/tiles/` (move the tile components there; `features/rooms` can't import from `features/home/favorites` cleanly). `src/domains/onOffActions.ts` (the HA domain comes from the entity ID, so `input_boolean.turn_on`/`turn_off` works unchanged; update the comment). `src/config/favoriteDomains.ts` (allow `input_boolean` in the editor). `src/domains/input_boolean/factories.ts` (new, per principle 18). Don't edit `src/infrastructure/fakeHa/fakeHa.ts`: 019 adds `input_boolean` there and restructures service handling in parallel.
- The tile files today: `FavoriteTile`, `ControlTile` (the whole tile is one `ActionButton`), `DisplayTile`, `Tile` (`TileBody`, `TileLabel`, `TileControl`, `TileFrame`), `LightTile`, `OnOffTile`, `SceneTile`, `ScriptTile`, `StateTile`, and `favoriteIcon.ts`. Move all of them.
- `EntityTile({ entityId, variant = 'favorite' })`, with `variant: 'favorite' | 'room'`. This task renders both variants the same; the room card (012) passes `variant="room"`, and 014/015 turn on brightness drag and the ⋯ button for `room` inside the light tile, so they never edit `RoomCard.tsx` (which 016 changes in parallel).
- `EntityTile` keeps `FavoriteTile`'s rules: explicit on/off from what's showing, disabled unless connected and the entity is `ok`, inline failure that clears on the next state change. `FavoriteTile` becomes `EntityTile` (or a one-line wrapper) so favorites tests and specs pass unchanged.
- Tile CSS moves with the components; favorites' grid layout stays in `FavoritesSection.css`.

## Requirements (Test Descriptions)

- [x] `it toggles an input_boolean tile with an explicit turn_on or turn_off`
- [x] `it lets the favorites editor add an input_boolean`
- [x] `it renders the same tile for a light, switch, fan, scene, script, and display-only entity as favorites did`

## Acceptance Criteria

- All requirements have passing tests
- Existing favorites unit tests and `e2e/favorites.spec.ts`, `e2e/controls.spec.ts` pass unchanged
- Code follows code standards
- No decrease in test coverage

## Implementation Notes
Tile components, `entityIcon.ts` (was `favoriteIcon.ts`), and the tile CSS (`EntityTile.css`) moved to `src/features/shared/tiles/`; `FavoriteTile` is now `EntityTile` with an unused-for-now `variant` prop. `statusText.ts` moved to `src/features/shared/`. `input_boolean` shares the switch/fan on/off tile. The third requirement's test passed immediately (the move was behavior-preserving); it pins the six kinds.
