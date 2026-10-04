# Task 005: Fan and Script Favorite Tiles

**Status**: completed
**Issue**: #22
**Depends on**: 001, 002, 004
**Retry count**: 0

## Description

Add the fan and script HA domains: factories, view models, and domain actions. Make their favorite tiles tappable. A fan tile toggles on and off like a switch (no speed). A script tile runs the script with `script.turn_on` and shows "Running" while HA reports the script as `on`.

## Context

- Related files:
  - New: `src/domains/fan/{factories,viewModel,actions}.ts`, `src/domains/script/{factories,viewModel,actions}.ts` (+ tests), `src/features/home/favorites/FanTile.tsx`, `ScriptTile.tsx`
  - Modify: `src/features/home/favorites/FavoriteTile.tsx` (new `case 'fan'` and `case 'script'`), `e2e/controls.spec.ts`
  - Reference: `src/domains/switch/` (smallest on/off domain), `src/domains/onOffActions.ts` from task 004, `src/domains/entityStatus.ts`
- Fan uses `onOffViewModel` and `setOnOff`. Speed and presets are out of scope.
- Script: `runScript(gateway, scriptId)` → `callService('script', 'turn_on', undefined, { entity_id })`. Task 008 reuses it for filter resets. A script tile is a plain button (no `aria-pressed`): it runs something and has no on/off state to toggle. While HA reports the script as `on` (running), the tile is disabled so it can't be started twice (user decision; HA's default `single` mode would reject a second start anyway).
- Factories follow `src/domains/switch/factories.ts` and stay importable from `e2e/` (explicit `.ts` imports). Task 010's demo house uses them.
- Use task 004's contract: `FavoriteTile` is the container; `FanTile` uses `Tile`'s toggle mode, `ScriptTile` uses its run mode (no `aria-pressed`); failures render through `ActionError`. Don't add a new button variant to `Tile.tsx`.
- E2E specs must seed the script entity in `haOptions.entities`: the fake HA answers `not_found` for an entity it doesn't have.
- Task 006 runs after this one and edits the same `FavoriteTile.tsx` switch and `e2e/controls.spec.ts`.

## Requirements (Test Descriptions)

- [x] `it sends fan.turn_on when an off fan tile is tapped`
- [x] `it sends script.turn_on with the script as the target when a script tile is tapped`
- [x] `it shows "Running" on a script tile while HA reports the script as on`
- [x] `it disables a script tile while HA reports the script as running`
- [x] `it shows "Didn't work, tap to retry" on a script tile when the run fails`
- [x] `it disables a fan or script tile for an unavailable or missing entity`

## Acceptance Criteria

- All requirements have passing tests
- `e2e/controls.spec.ts` covers a fan and a script tap against the mock
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Added `domains/fan` and `domains/script` (factories, view models, actions + tests). Fan reuses `onOffViewModel`/`setOnOff`; `scriptViewModel` exposes `isRunning`; `runScript(gateway, scriptId)` is ready for task 008.
- `FanTile` uses Tile's toggle mode; `ScriptTile` uses run mode (no `aria-pressed`), shows "Run"/"Running", and is disabled while running. `FavoriteTile` has `fan` and `script` cases.
- Component tests live in `FavoritesSection.test.tsx`; `e2e/controls.spec.ts` has a fan and script tap spec. The fake HA already treats `fan` as switchable; `script.turn_on` doesn't change state there.
