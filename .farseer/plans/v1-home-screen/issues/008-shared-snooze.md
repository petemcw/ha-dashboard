# Task 008: Shared snooze for attention items

**Status**: pending
**Depends on**: 001, 002, 003, 005, 006, 007, 011
**Retry count**: 0

## Description

Let an admin snooze any attention item for 1 day or 1 week. Snoozes are stored in HA's shared frontend system data, so every device and user sees the same set. A snooze drops when it expires or when its alert resolves. Non-admins see that an item is snoozed but get no snooze action, because `frontend/set_system_data` is admin-only.

## Context

- Related files: `src/features/home/attention/` (all item components, `useAttentionItems.ts`), `src/infrastructure/ha/connection.ts`, `e2e/haMock.ts` (system data and `auth/current_user` already mocked)
- New:
  - `src/infrastructure/appData/systemData.ts` + `useSystemData(key)`, following the shape of `userData.ts` from task 011: wraps `frontend/subscribe_system_data` (sends `{value}` on subscribe and after every change), `frontend/set_system_data`. Re-subscribes after reconnect (the library restores subscriptions made with `subscribeMessage`).
  - `src/infrastructure/ha/currentUser.ts` + `useCurrentUser()`: `getUser(conn)` from `home-assistant-js-websocket` (`auth/current_user`), exposing `id` and `isAdmin`.
  - `src/features/home/attention/snoozes.ts` (pure): parse the stored value, `isSnoozed(itemId, now)`, `addSnooze`, `cleanup(resolvedItemIds, now)`.
  - `useSystemData(key)` returns `{ value, loaded }` like `useUserData` (011); `loaded` turns true with the first `{value}` from the subscription.
  - `SnoozeMenu.tsx`: a visible "Snooze" button (no hold or long-press gesture) opening "1 day" / "1 week" choices.
- Key `ha-dashboard:snoozes`; value `{ version: 1, snoozes: { [itemId]: { until: ISO string, by: user id } } }`. Treat an unknown version or malformed value as no snoozes and don't overwrite it.
- Snoozed items are hidden from the urgent list and chore row. A small "N snoozed" disclosure lists them (title and "until Fri 9:00"); admins can unsnooze from there.
- Cleanup (admin clients only): remove a stored snooze when `until` has passed or its id is in `resolvedIds` from `useAttentionItems()` (the contract in 005). **Never** remove one just because the item isn't active. An unavailable or unknown entity, a missing entity, or a left-on entity still on but under its duration after an HA restart all leave the snooze in place. Otherwise a dead battery that flaps to `unavailable` loses its snooze and nags again. Debounce the write (e.g. 5 s), compute it from the latest state when the timer fires (not the state when it was scheduled), and only write when something changed, so admin clients don't fight. Merge against the latest subscribed value before writing.
- Cleanup only runs while the connection is `connected`, the entity store `isLoaded`, and system data `loaded`. Before the first entity snapshot nothing is resolved anyway, but the gate keeps a refactor from turning "empty store" into "delete every snooze".
- Writes (snooze, unsnooze, cleanup) are disabled until system data has `loaded`, and while the stored value has an unknown version or is malformed (show the snooze state as unavailable rather than overwriting someone else's data).
- While a snooze or unsnooze write is in flight, disable the snooze controls (pending state lives in the action, per architecture principle 10) and compute the next value from the latest subscribed value, so two quick taps don't overwrite each other.
- Non-admin: no Snooze button and no unsnooze; the "N snoozed" disclosure is still visible.
- A failed write (e.g. `unauthorized`) shows a non-blocking error and leaves the item visible.

## Requirements (Test Descriptions)

- [ ] `it hides an item snoozed until a time in the future`
- [ ] `it shows an item again once its snooze has expired`
- [ ] `it stores a one-week snooze in shared system data when an admin chooses 1 week`
- [ ] `it removes a stored snooze when its item has resolved`
- [ ] `it keeps a snooze while its entity is unavailable`
- [ ] `it does not remove snoozes before the first entity snapshot arrives`
- [ ] `it does not offer a snooze action until the stored snoozes have loaded`
- [ ] `it does not offer a snooze action to a non-admin user`
- [ ] `it shows a snooze made on another device without a reload`
- [ ] `it ignores a stored value with an unknown version`

## Acceptance Criteria

- All requirements have passing tests (pure snooze logic in Vitest; in `e2e/attention.spec.ts`, one Playwright mock spec snoozes as admin and asserts the stored value; one as non-admin asserts no Snooze button)
- Coverage ≥ 80% for `src/infrastructure/appData` and `src/infrastructure/ha/currentUser.ts`
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
