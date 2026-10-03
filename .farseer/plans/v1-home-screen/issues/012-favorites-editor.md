# Task 012: Favorites editor in the settings sheet

**Status**: completed
**Depends on**: 001, 002, 003, 005, 006, 011
**Retry count**: 0

## Description

Add an "Edit favorites" section to the settings sheet: search controllable entities by name or entity ID, add them, remove them, and reorder them. Changes save to the user's HA frontend data, and the home screen updates live.

## Context

- Related files: `src/app/settings/SettingsSheet.tsx`, `src/infrastructure/appData/userData.ts`, `src/features/home/favorites/favoritesValue.ts`, `src/config/home.ts` (`favoriteDomains`), `src/infrastructure/entities/` (`useEntityIds(predicate)` from task 006)
- New: `src/features/favorites-editor/` (`searchEntities.ts` pure, `FavoritesEditor.tsx`), a settings section that renders it.
- Search: case-insensitive match on `friendly_name` or `entity_id`, limited to `favoriteDomains`, excluding entities already in the list, capped at 20 results. Show the friendly name and entity ID for each result.
- Reorder with "Move up" / "Move down" buttons per item (accessible names include the entity name). No drag-only interaction.
- Remove with a "Remove <name>" button. Missing entities (saved but gone from HA) can be removed.
- Search reads names through `useEntityIds(predicate)` from 006, whose predicate receives the state object. Memoize the predicate on the query (and the current list) so the hook doesn't recompute on every render.
- Save on each change through `frontend/set_user_data` with `{ version: 1, entityIds }`. Show a non-blocking error if the write fails and keep the previous list.
- **Don't overwrite what you haven't read.** Each save is a read-modify-write of the whole list:
  - Disable the editor's add, move, and remove controls until `useUserData` reports `loaded`. Otherwise a save before the first `{value}` replaces the stored list with a nearly empty one.
  - If the stored value has an unknown version or is malformed, 011 shows no favorites. The editor shows a short message and offers no save, so it doesn't overwrite data a newer app version wrote.
  - While a save is in flight, disable the controls (pending state lives in the action, per architecture principle 10). Compute the next list from the latest subscribed value. Otherwise an add followed quickly by a remove computes the second write from the old list and drops the add.
- This writes real user data on a real instance, so Playwright coverage uses the mock only.

## Requirements (Test Descriptions)

- [x] `it finds entities by friendly name or entity ID`
- [x] `it only offers entities from controllable domains`
- [x] `it does not offer an entity that is already a favorite`
- [x] `it saves an added favorite to the user's data`
- [x] `it moves a favorite up in the saved order`
- [x] `it removes a favorite, including one missing from Home Assistant`
- [x] `it keeps the previous list and shows an error when saving fails`
- [x] `it does not allow edits until the user's favorites have loaded`
- [x] `it disables editing while a save is in progress`
- [x] `it does not overwrite a stored value with an unknown version`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec in `e2e/favorites-editor.spec.ts` adds, reorders, and removes, then asserts `mock.userData`)
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `src/features/favorites-editor/`: `searchEntities.ts` (`matchesSearch(entity, query, favorites)`, `MAX_RESULTS` 20, used as the `useEntityIds` predicate, memoized on query and list), `useFavoritesEditor.ts` (read-modify-write action: `canEdit = loaded && writable && !saving`, next list computed from a ref of the latest subscribed value, no optimistic update so a failed save keeps the list, error shown as `role=alert`), `FavoritesEditor.tsx` (Move up/Move down/Remove/Add buttons with entity names in accessible names; unknown-version value shows a message and no controls).
- `src/app/settings/FavoritesSettingsSection.tsx` wired into `AppShell` before the kiosk section. It is a `<section>` with an `<h3>`, not a fieldset: a legend overlapped the controls on phone when the sheet scrolled and swallowed taps.
- `src/index.css` (append only): editor styles, plus `html, body { overflow-x: hidden }`. The unstyled attention rows (long entity IDs when entities are missing) widened the phone page, and the fixed sheet then ran off the right edge. Worth a real fix in the attention rows later.
- e2e: `e2e/favorites-editor.spec.ts` (mock only; adds, reorders, removes, asserts `mockHa.userData`, no call_service). No `@live` spec opens the editor.
- Full vitest run had 4 failures in `src/infrastructure/ha/connection.test.ts` and `startupRetry.test.ts` (task 015's in-progress files); not touched. Format, lint, tsc, my vitest files and favorites e2e pass. No read-only files edited.
