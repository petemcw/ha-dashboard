# Task 012: Favorites editor in the settings sheet

**Status**: pending
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

- [ ] `it finds entities by friendly name or entity ID`
- [ ] `it only offers entities from controllable domains`
- [ ] `it does not offer an entity that is already a favorite`
- [ ] `it saves an added favorite to the user's data`
- [ ] `it moves a favorite up in the saved order`
- [ ] `it removes a favorite, including one missing from Home Assistant`
- [ ] `it keeps the previous list and shows an error when saving fails`
- [ ] `it does not allow edits until the user's favorites have loaded`
- [ ] `it disables editing while a save is in progress`
- [ ] `it does not overwrite a stored value with an unknown version`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec in `e2e/favorites-editor.spec.ts` adds, reorders, and removes, then asserts `mock.userData`)
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
