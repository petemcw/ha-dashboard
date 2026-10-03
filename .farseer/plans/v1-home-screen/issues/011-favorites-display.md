# Task 011: Per-user favorites display

**Status**: completed
**Depends on**: 001, 002, 003, 005
**Retry count**: 0

## Description

Show the logged-in HA user's favorites as state-only tiles in the favorites region. The list is stored in HA's per-user frontend data, so it follows the user to any device. With nothing saved yet, the region shows an "Add favorites" prompt that opens the settings sheet.

## Context

- Related files: `src/config/home.ts` (`favoriteDomains`), `src/features/home/HomeScreen.tsx` (favorites region), `src/domains/light/`, `src/domains/switch/` (from task 005), `src/app/settings/` (open the sheet from the prompt), `e2e/haMock.ts` (user data mocked)
- New:
  - `src/infrastructure/appData/userData.ts` + `useUserData(key)`: wraps `frontend/subscribe_user_data` (checked live: sends `{value}` on subscribe and after every set) and `frontend/set_user_data`. Per HA user; any user can write. This sets the app-data store pattern that task 008's `systemData.ts` follows.
  - `src/features/home/favorites/` (`favoritesValue.ts` pure parse/serialize, `FavoritesSection.tsx`, `FavoriteTile.tsx`).
  - Domain components: `LightTile.tsx` (on/off and brightness %), `SwitchTile.tsx`, and a generic state tile for the other favorite domains (fan, media_player, cover, climate, lock, scene, script) showing HA's state text. Tiles are display-only in v1: not buttons, no tap action.
- Key `ha-dashboard:favorites`; value `{ version: 1, entityIds: string[] }`. Unknown version or malformed value → treat as empty and don't overwrite.
- Brightness % from `attributes.brightness` (0–255): 255 → 100%, 128 → 50% (round half up). A light that is off has no brightness.
- Each tile handles `unavailable`, `unknown`, and missing (an ID saved earlier that no longer exists in HA shows as missing, not removed).
- Prompt (empty or no value): "No favorites yet" with an "Add favorites" button that opens the settings sheet. The button calls the `onOpenSettings` prop that `HomeScreen` passes to `FavoritesSection` (001), wired to the sheet by `AppShell` (002). Features can't import `src/app/`.
- `useUserData(key)` returns `{ value, loaded }`; `loaded` turns true with the first `{value}` from the subscription. Until then, render nothing (or a neutral placeholder), not the "No favorites yet" prompt. Task 012 and the snooze store in 008 use `loaded` to block writes that would overwrite data they haven't read yet.

## Requirements (Test Descriptions)

- [x] `it shows an Add favorites prompt when the user has no saved favorites`
- [x] `it does not show the Add favorites prompt before the user's data has loaded`
- [x] `it shows the user's saved favorites in their saved order`
- [x] `it shows a light that is on with its brightness as a percentage`
- [x] `it shows a switch as on or off`
- [x] `it shows a saved favorite that no longer exists in Home Assistant as missing`
- [x] `it shows favorites saved on another device without a reload`
- [x] `it treats a stored value with an unknown version as no favorites`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec in `e2e/favorites.spec.ts` seeds user data)
- Coverage ≥ 80% for `src/infrastructure/appData` and the touched `src/domains/*`
- Code follows code standards

## Implementation Notes

- `src/infrastructure/appData/`: `userData.ts` (`subscribeUserData(conn, key, cb)`, `setUserData(key, value, connect?)`) and `useUserData(key, connect?)` returning `{ value, loaded }`. Tests inject the connection provider like `useHourlyMeans`. Task 008's `systemData.ts` can mirror it.
- `src/domains/light/viewModel.ts` now returns `brightnessPercent` (additive; `LightViewModel` type exported). New `src/domains/generic/viewModel.ts` (`stateViewModel`) for fan, media_player, cover, climate, lock, scene, script.
- `src/features/home/favorites/`: `favoritesValue.ts` (`FAVORITES_KEY`, `parseFavorites` returns `{ entityIds, writable }`: `writable: false` for unknown version or junk so task 012 must not overwrite; `serializeFavorites`), `FavoritesSection`, `FavoriteTile` (picks tile by domain, missing entities keep their id as name), `LightTile`, `SwitchTile`, `StateTile`, `Tile`, `statusText.ts`. Tiles are `<li>`, no buttons, no `call_service`.
- Small additive CSS for `.favorites` / `.favorite-tile` in `src/index.css`.
- `e2e/favorites.spec.ts` (phone and tablet, mock): prompt opens settings, saved order/state/missing, another-device write via a raw socket to the mock appears without reload, unknown version shows the prompt and sends no set. Mock edge: tests must request `mockHa` to install it.
- Tests were written alongside code per slice. appData coverage 95% lines. No read-only files edited. Full format, lint, vitest (146), tsc build and the favorites e2e pass.
