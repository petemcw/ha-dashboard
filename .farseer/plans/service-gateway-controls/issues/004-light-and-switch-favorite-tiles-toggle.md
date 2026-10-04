# Task 004: Light and Switch Favorite Tiles Toggle

**Status**: completed
**Issue**: #21
**Depends on**: 001, 002
**Retry count**: 0

## Description

The first end-to-end control: tapping a light or switch tile in Favorites sends `turn_on` or `turn_off` through the gateway, shows a pending state, and shows an inline "Didn't work, tap to retry" on failure. This task sets the pattern for every later tile: a `<button>` inside the tile's `<li>`, `aria-pressed` for on/off, and disabled while offline, pending, unavailable, or missing.

## Context

- Related files:
  - New: `src/domains/onOffActions.ts` (shared `setOnOff(gateway, entityId, on)` that derives the HA domain from the `entity_id`), `src/domains/light/actions.ts`, `src/domains/switch/actions.ts` (+ tests against the fake gateway), `e2e/controls.spec.ts`
  - New: `src/features/shared/ActionError.tsx` (shared inline error, see below)
  - Modify: `src/features/home/favorites/Tile.tsx` (interactive modes: a full-tile `<button>`, pending, and the inline error), `LightTile.tsx`, `SwitchTile.tsx` (presentational: take `onPress`/`pending`/`failed`/`disabled` props), `FavoriteTile.tsx` (the container: calls `useServiceGateway`, `useAction`, and `useControlsEnabled` and passes props down), `FavoritesSection.test.tsx`, `src/index.css`
  - Reference: `src/domains/onOff.ts`, `src/domains/light/viewModel.ts`, `src/features/home/favorites/statusText.ts`, `e2e/favorites.spec.ts` (how favorites are seeded through user data)
- Direction comes from the view model at tap time: a tile that shows on sends `turn_off`, and one that shows off sends `turn_on`. Never `toggle`.
- Pending ends when the gateway call settles (HA's acknowledgement). The tile's on/off comes only from the entity store; there is no optimistic state.
- Display-only tiles (`StateTile`: media_player, cover, climate, lock) stay non-interactive.
- `@live` specs must never tap a control. The `liveTest` guard already blocks `call_service`.
- **Hooks in containers (review I5).** `.farseer/code-standards.md`: components take view models as props and don't import infrastructure. `FavoriteTile` is the container; `LightTile`, `SwitchTile`, and `Tile` stay presentational.
- **Shared control contract (review I6).** Tasks 005–008 build on these, so define them here:
  - `Tile` modes: no `onPress` → display-only `<li>` as today; `onPress` with `pressed: boolean` → toggle button with `aria-pressed`; `onPress` with `pressed` undefined → run button (script and scene tiles, task 005/006), no `aria-pressed`.
  - Accessible name: the button's name is the friendly name only (`aria-labelledby` the name span); the state text ("On, 50%") is its `aria-describedby` description. A toggle button's name must not change when pressed, and specs select `getByRole('button', { name: 'Kitchen' })`. Existing `getByRole('listitem')` text assertions in `e2e/favorites.spec.ts` keep passing.
  - `ActionError` (`src/features/shared/`): always renders a `role="status"` element (an empty live region exists before the text arrives, so screen readers announce it) and fills it from `useAction`'s `failure` (task 001): "Didn't work, tap to retry" for `'rejected'`, and "Connection dropped, check before retrying" for `'connection-lost'` (the call may have run in HA; user decision). Tiles, suggestion buttons (006), and attention actions (007, 008) all use it.
  - Clearing: the container passes the target's state text (or another value derived from its view model) as `useAction`'s `clearKey`, so the error clears when HA reports a change, after 60 s, or on the next tap.
- Component tests use the task 001 helpers: `renderWithHome(ui, { gateway: fake })` and `setConnected()` with `resetConnectionStatus()` in `afterEach`.

## Requirements (Test Descriptions)

- [x] `it sends light.turn_on when an off light tile is tapped`
- [x] `it sends switch.turn_off when an on switch tile is tapped`
- [x] `it marks an on tile as pressed for assistive technology`
- [x] `it disables the tile while the action is pending`
- [x] `it shows "Didn't work, tap to retry" when the action fails`
- [x] `it disables controls while the connection is not connected`
- [x] `it disables the tile for an unavailable or missing entity`
- [x] `it names a tile's button by the entity's name and describes it with its state`
- [x] `it shows "Connection dropped, check before retrying" when the connection drops mid-call`
- [x] `it clears the error when HA reports the entity changed`

## Acceptance Criteria

- All requirements have passing tests (Vitest for domain actions and components)
- `e2e/controls.spec.ts` (mock) taps a light and a switch at both viewports and checks the `call_service` message (`mockHa.sent()`) and the updated tile
- Phone and tablet screenshots checked; touch targets at least 44×44 px
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `src/domains/onOffActions.ts` `setOnOff` (explicit turn_on/turn_off), wrapped by `light/actions.ts` `setLight` and `switch/actions.ts` `setSwitch`.
- `Tile` exports `TileControl` (onPress, pressed, pending, failure, disabled). Modes as specified; the button is labelled by the name span and described by the state span. Pending uses `aria-disabled` (keeps focus, ignores taps); unavailable/missing/offline use real `disabled`.
- `ActionError` always renders an empty `role="status"`. `FavoriteTile` is the container (gateway, useAction with `clearKey: entity?.state`, controls-enabled).
- CSS in a separate "Favorite tile controls" block at the end of `src/index.css`.
- Tests: component tests in `FavoritesSection.test.tsx`, `e2e/controls.spec.ts` (phone+tablet, 44px targets checked). Full `npm run build` currently fails only on task 009's in-progress files (`demoSocket.ts`, `App.demo.test.tsx`).
