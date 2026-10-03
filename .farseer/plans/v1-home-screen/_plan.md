# Plan: v1 Home Screen

## Created

2026-10-03

## Status

ready

## Objective

Replace the scaffold's status page with a home screen that shows what needs attention, who's home, the user's favorites, and crypto prices, live from HA over the WebSocket. v1 never calls an HA action that changes a device. Its only writes are app data: per-user favorites and shared snoozes.

## User Stories

1. As a household member, I want the dashboard to open straight to a home screen, so that I see the house's state without navigating.
2. As a household member, I want the garage door to show as needing attention once it has been open for 10 minutes, so that I notice it was left open.
3. As a household member, I want the garage door not to appear while it has been open for less than 10 minutes, so that a normal trip in or out doesn't raise an alert.
4. As a household member, I want the garage work lights to show as needing attention after 30 minutes on, so that I don't leave them on overnight.
5. As a household member, I want the space heater to show as needing attention after 1 hour on, so that it isn't left running unattended.
6. As a household member, I want the bed lightstrip to show as needing attention after 30 minutes on, so that I remember to turn it off.
7. As a household member, I want a "left on" item to appear on its own when its time is reached, without reloading, so that a wall screen stays accurate.
8. As a household member, I want "left on" items to be large and at the top, so that urgent things stand out from chores.
9. As a household member, I want any battery sensor below 20% listed as a chore, so that I replace batteries before devices die.
10. As a household member, I want phone and iPad batteries ignored, so that daily charging doesn't create noise.
11. As a household member, I want pending updates for the living room switch firmware, the HA Docker image, and the "Update firmware" entity listed as chores, so that I know when to update.
12. As a household member, I want low printer toner (below 15%) listed as a chore with a reorder link that works, so that I can reorder from the dashboard.
13. As a household member, I want a filter with fewer than 5 days left (furnace, fridge water, fridge air) listed as a chore, so that I replace it on time.
14. As a household member, I want chores in a compact row, so that they don't crowd out urgent items.
15. As a household member, I want an alert whose entity is `unavailable` or `unknown` not to show as a problem with a made-up value, so that the dashboard never lies.
16. As the dashboard owner, I want an attention rule whose entity no longer exists in HA to show as a missing-entity chore, so that I find broken config.
17. As a household member, I want actions that would change devices (open the door, mark a filter replaced) shown but disabled in v1, so that I can see what's coming without risk.
18. As an admin, I want to snooze an attention item for 1 day or 1 week, so that a known issue (dead camera battery, overdue filter) stops nagging me.
19. As a household member, I want snoozes to be shared across every device and user, so that the kiosk and phones agree on what's hidden.
20. As a household member, I want a snoozed item to come back once its snooze expires, so that I don't forget it entirely.
21. As a household member, I want a snooze dropped as soon as its alert resolves, so that the next occurrence alerts normally.
22. As a non-admin user, I want to see that an item is snoozed but not be offered a snooze action I can't use, so that the UI never fails on me.
23. As a household member, I want the TV scene suggestions shown in their own strip, separate from alerts, so that a suggestion never looks like a problem.
24. As a household member, I want suggestions disabled with a clear "not yet" state in v1, so that I know they're coming.
25. As a household member, I want the "dim for TV" suggestion only while the family room Apple TV is playing, and "brighten" only while it's paused, so that suggestions fit the moment.
26. As a household member, I want a compact row of everyone in the family with a home/away marker, so that I know who's home at a glance.
27. As a household member, I want to see the zone name when someone is away in a named zone, so that I know where they are.
28. As a household member, I want people with no tracker to show as unknown, not away, so that the row doesn't mislead.
29. As a household member, I want each person's photo from HA, with initials when there's no photo or it fails to load, so that the row is recognizable.
30. As a logged-in user, I want my own favorites list, so that I see the things I use.
31. As a new user or a fresh kiosk, I want an empty favorites section with an "Add favorites" prompt, so that I know how to set it up.
32. As a user, I want each favorite to show its live state (on/off, brightness for lights), so that I can check things at a glance.
33. As a user, I want to add, remove, and reorder favorites from the settings sheet, so that I control my list.
34. As a user, I want to find entities to favorite by searching name or entity ID, so that I don't need to know IDs.
35. As a user, I want only controllable entities (lights, switches, fans, media players, covers, climate, locks, scenes, scripts) offered as favorites, so that the list stays useful once controls arrive.
36. As a user, I want my favorites saved in HA, so that they follow me to any device I log in on.
37. As a household member, I want a row with BTC, ETH, and SOL prices, their 24-hour change, and a small trend line, so that I can check them at a glance.
38. As a household member, I want crypto prices to update live, so that they're current on the wall screen.
39. As a household member, I want a banner when the connection drops and dimmed values while stale, so that I don't trust outdated state.
40. As a household member, I want the banner to clear on reconnect without a reload, so that the kiosk recovers on its own.
41. As a household member, I want the dashboard to follow my phone's light or dark mode, so that it matches my device.
42. As a household member, I want to override the theme (System / Light / Dark) per device, so that the kiosk can stay dark.
43. As a user, I want to sign out from the settings sheet, so that I can switch accounts or hand over a device.
44. As the kiosk owner, I want to open `/?kiosk` on a fresh tablet and paste a long-lived token instead of being sent to the HA login, so that the wall screen can be set up without anyone logging in on it.
45. As the kiosk owner, I want to replace the kiosk token from the settings sheet, so that I can rotate it.
46. As the kiosk owner, I want a rejected token to show an error and be cleared, so that the kiosk doesn't loop on bad credentials.
47. As the dashboard owner, I want the home screen usable at phone (393×852) and tablet (1180×820) sizes with 44 px touch targets, so that it works on both targets.
48. As the developer, I want e2e tests against a mocked HA WebSocket, so that tests can cover writes (favorites, snoozes) without touching the real house.
49. As the developer, I want `@live` tests to stay read-only, so that the real house and my real user data are never changed by tests.

## Related Issues

GitHub issues created from this plan (issue numbers differ from task numbers):

| Task | Issue | Task | Issue | Task | Issue |
| ---- | ----- | ---- | ----- | ---- | ----- |
| 001  | #1    | 006  | #6    | 011  | #10   |
| 002  | #2    | 007  | #7    | 012  | #11   |
| 003  | #3    | 008  | #14   | 013  | #12   |
| 004  | #4    | 009  | #8    | 014  | #15   |
| 005  | #5    | 010  | #9    | 015  | #13   |

## Discovery Notes

- The repo is still the scaffold: `src/App.tsx` subscribes to entities and shows a status line; `src/ha.ts`, `src/config.ts`, `src/storageKeys.ts` handle connection, runtime config, and storage keys. `.farseer/architecture.md` defines the target layout (`app/`, `features/`, `domains/`, `infrastructure/`, `config/home.ts`); task 001 moves the existing files into it.
- Feature decisions come from walking through the Lovelace `dashboard-home` dashboard (`docs/feature-decisions.md`) and a follow-up interview.
- Checked live on HA 2026.9.4:
  - `frontend/get_user_data`, `frontend/set_user_data`, `frontend/subscribe_user_data` exist; per user; any user can write. Subscribe sends `{value}` immediately.
  - `frontend/get_system_data`, `frontend/subscribe_system_data` are readable by any user; `frontend/set_system_data` is `require_admin` (verified in HA source at tag 2026.9.4).
  - `auth/current_user` returns `is_admin`; `home-assistant-js-websocket` exports `getUser`.
  - `recorder/statistics_during_period` with `period: 'hour'`, `types: ['mean']` returns `{ [statistic_id]: [{ start, end, mean }] }` (ms timestamps); BTC/ETH/SOL have statistics.
  - Person pictures (`entity_picture: /api/image/serve/<id>/512x512`) load from HA without auth; a relative path must be resolved against the HA URL.
  - `last_changed` resets on HA restart.
- Only one real HA user exists today (owner/admin). The other five `person` entities have no linked user. Favorites are keyed to the HA user, so family members get theirs once they have accounts; no app change needed.
- `update.update_firmware` isn't in the entity registry and has no device; included as decided.
- Kiosk (owner decisions after review): the kiosk's token belongs to a dedicated non-admin HA user, and kiosk mode is remembered per device so a revoked token returns to the token form, never the OAuth login.
- Work is committed directly on `master` (owner's preference), so no feature branch.

## Scope

### In Scope

- Move the scaffold into the target layout; entity store with per-entity selector hooks; connection status store.
- `src/config/home.ts` with every v1 entity ID and rule threshold.
- App shell: header, settings sheet (edit favorites, theme override, sign out, kiosk token), connection banner with stale dimming, neutral light/dark design tokens.
- Kiosk token entry at `/?kiosk`.
- Connection resilience: retry when HA is unreachable at startup; heartbeat ping to catch silent disconnects.
- Attention: four "left on" rules with durations (urgent tier); battery, update, toner, and filter rules (chore tier); missing-entity chores; disabled device actions; working toner link.
- Snooze (1 day / 1 week, shared via system data, admin-only, dropped on resolve).
- Suggestions strip (TV scenes), disabled.
- Presence row.
- Per-user favorites: display and editing via user data.
- Crypto row with statistics sparkline.
- Playwright HA WebSocket mock seeded from domain factories; e2e at phone and tablet sizes; `@live` fixture guard that blocks writes before they reach HA; `@live` smoke updated, still read-only.

### Out of Scope

- Any HA action that changes a device (garage door, scenes, filter scripts, toggling favorites). These come after demo mode.
- Demo mode (`?demo`) and the fake service gateway's UI wiring.
- Rooms/areas, room source, light detail sheets, media controls.
- Weather, sunrise/sunset, filter days-left list.
- Final palette and visual design.
- Creating HA accounts for family members.
- History-based onset times for "left on" rules.

## Success Criteria

- [ ] The home screen shows attention (urgent and chores), suggestions, presence, favorites, and crypto from live HA at phone and tablet sizes.
- [ ] Each attention rule matches the thresholds in `src/config/home.ts` and has unit tests for below, at, and above its threshold plus `unavailable`, `unknown`, and missing.
- [ ] An admin can snooze an item for 1 day or 1 week; the snooze shows on another device within seconds; a non-admin sees no snooze action.
- [ ] Favorites edits persist per HA user and appear on another device logged in as the same user.
- [ ] `/?kiosk` with no stored credentials shows the token form and never redirects to the HA login.
- [ ] Dropping the WebSocket shows the banner and dims values; reconnecting clears both without a reload.
- [ ] A socket that goes silent without closing is detected by the heartbeat and reconnected; starting while HA is unreachable keeps retrying instead of stopping on an error.
- [ ] No code path in v1 sends `call_service`.
- [ ] No `call_service` or `frontend/set_*` message from a `@live` test reaches HA (the live fixture blocks them), and a `@live` test fails if the page sends `call_service` or `frontend/set_user_data`.
- [ ] All tests passing (`npm run format:check && npm run lint && npm test && npm run build`, `npm run test:e2e`)
- [ ] Coverage at or above 80% for `src/domains/` and `src/infrastructure/`
- [ ] Code follows project standards

## Task Overview

| Task | Description                                                   | Depends On                                   | Status  |
| ---- | ------------------------------------------------------------- | -------------------------------------------- | ------- |
| 001  | Move scaffold into target layout with entity store and config | -                                            | pending |
| 002  | App shell: tokens, connection banner, settings sheet          | 001                                          | pending |
| 003  | Playwright HA WebSocket mock and live read-only guard         | 001                                          | pending |
| 004  | Kiosk token entry                                             | 001, 002, 003                                | pending |
| 005  | Attention: left-on rules and urgent tier                      | 001, 003                                     | pending |
| 006  | Attention chores: low batteries and pending updates           | 001, 003, 005                                | pending |
| 007  | Attention chores: printer toner and filters due               | 001, 003, 005, 006                           | pending |
| 008  | Shared snooze for attention items                             | 001, 002, 003, 005, 006, 007, 011               | pending |
| 009  | Presence row                                                  | 001, 003                                     | pending |
| 010  | Crypto row with 24-hour sparkline                             | 001, 003                                     | pending |
| 011  | Per-user favorites display                                    | 001, 002, 003, 005                           | pending |
| 012  | Favorites editor in the settings sheet                        | 001, 002, 003, 005, 006, 011                 | pending |
| 013  | Suggestions strip (disabled)                                  | 001, 003                                     | pending |
| 014  | Home screen composition, layouts, and live smoke              | 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 015 | pending |
| 015  | Connection resilience: startup retry and heartbeat            | 001, 002, 003                                | pending |

## Architecture Notes

- Follow `.farseer/architecture.md`: imports flow `app → features → domains → infrastructure`; components take view models; one external entity store read through per-entity selector hooks; `unavailable`/`unknown`/missing are first-class in every view model.
- **Attention is a feature** (`src/features/home/attention/`): pure rule functions take entity view data, `now`, and rule config and return `AttentionItem`s with a stable `id` (`<ruleId>` or `<ruleId>:<entity_id>` for generalized rules) and a `tier` (`urgent` | `chore`). Domain view models (`domains/<ha-domain>/viewModel.ts`) do the per-entity interpretation (is on, battery level, update pending).
- **Rule results**: every attention rule returns `{ items, resolvedIds }`. An id is *resolved* only when its entity is present and available and the condition has cleared (off/closed, at or above the threshold, update not pending). Unavailable, unknown, missing, not-yet-loaded, and "on but under the duration" are neither active nor resolved. Snooze cleanup keys off `resolvedIds`, never off "not active". Missing-entity items use the id `missing:<entity_id>`.
- **Entity store**: exposes `isLoaded`; `HomeScreen` renders its regions only after the first snapshot, so nothing is reported missing before HA has sent the map. Selector hooks return state objects by reference (or primitives, or a cached array for `useEntityIds`), never a fresh object per `getSnapshot` call.
- **Time**: a single shared clock (one tick per 30 s) drives duration rules, so items appear without a reload and tests can inject `now`.
- **App data stores** live in infrastructure: `userData` (wraps `frontend/get|set|subscribe_user_data`) and `systemData` (wraps `frontend/get|set|subscribe_system_data`), each exposing a subscribe/read/write API and a hook returning `{ value, loaded }`. Writes are blocked until `loaded`, while the stored version is unknown, and while another write from the same control is in flight. Keys: `ha-dashboard:favorites` (user data), `ha-dashboard:snoozes` (system data). Values are versioned objects (`{ version: 1, ... }`) so the shape can change later.
- **Snooze value**: `{ version: 1, snoozes: { [itemId]: { until: <ISO>, by: <user id> } } }`. A snooze applies while `now < until` and the item is active. Admin clients remove entries whose item has *resolved* (see Rule results) or whose `until` has passed (cleanup write, debounced, only while connected and after both the entity map and system data have loaded). Non-admin clients only read.
- **No `call_service` in v1.** The service gateway isn't built in v1. Disabled actions render as disabled buttons with an accessible description ("Available when controls are enabled").
- **Theme**: CSS custom properties on `:root` for light and dark, `prefers-color-scheme` by default, `data-theme` override from a per-device localStorage key (wrapped in try/catch like `src/ha.ts`).
- **Kiosk token** uses the existing `LONG_LIVED_TOKEN_KEY` path. The token is never logged, rendered back, or sent anywhere except HA's auth.
- **Playwright mock** (`e2e/haMock.ts`) speaks the real wire protocol (`auth_required` → `auth` → `auth_ok`, `subscribe_entities` with compressed `a`/`c`/`r` events, `result` messages) and is seeded with the same domain factories Vitest uses. Mock-backed specs put a dummy token in localStorage (or none, with `seedToken: false`); they never need `HA_TOKEN` or `VITE_HA_URL`, and HA-origin HTTP is routed locally. `e2e/fixtures.ts` exports a separate `liveTest` (real token plus the read-only guard), because the current `page` override throws without `HA_TOKEN`. Each feature puts its mock spec in its own `e2e/<feature>.spec.ts`.
- **Factories are type-checked as e2e code.** `tsc -b` checks `e2e/` under `tsconfig.node.json` (`nodenext`, no DOM) and follows imports into `src/domains/**/factories.ts`. Factories and everything they import use explicit `.ts` relative imports, `import type` from the library, and no browser globals or `import.meta.env`.
- `src/config/home.ts` holds every entity ID and threshold for v1 (written in task 001 from `docs/feature-decisions.md`). Feature tasks read from it; they don't scatter IDs.

## Risks & Mitigations

- **Parallel tasks edit the same files** (`src/config/home.ts`, `features/home/HomeScreen.tsx`, `e2e/haMock.ts`): task 001 writes the complete v1 config and a `HomeScreen` with one placeholder region per section, and task 003 implements every message type the plan needs, so later tasks mostly add new files and fill their own region. Mock specs go in per-feature files rather than a shared `e2e/home.spec.ts`. `HomeScreen` takes an `onOpenSettings` prop from the start (001), so 011 doesn't need to edit it.
- **Snooze cleanup needs an admin client**: if an alert resolves and recurs while no admin client is open, it stays snoozed until expiry (max 1 week). Accepted; documented in the settings sheet help text.
- **Two admins writing snoozes at once** could overwrite each other (read-modify-write on one key). Low likelihood with one admin; the write merges against the latest subscribed value.
- **`last_changed` resets on HA restart**: duration alerts can appear up to one threshold late after a restart. Accepted.
- **Wire-protocol drift** between the mock and real HA: the `@live` smoke test checks the home screen renders against the real instance, read-only.
- **Writing real user data during development**: from task 003 on, the live fixture proxies the real WebSocket through `page.routeWebSocket`, never forwards `call_service` or `frontend/set_*`, and fails the test on `call_service` or `frontend/set_user_data`. A blocked `frontend/set_system_data` (admin snooze cleanup) is annotated, not failed, so live runs don't depend on house state. Live specs never open the editors and never register their own socket route.
- **Silent disconnects and cold starts** (kiosk): the library has no keepalive and defaults to `setupRetry: 0`. Task 015 adds startup retry and a ping heartbeat.
- **Snoozes lost to flapping devices or HA restarts**: cleanup only drops a snooze when its item has resolved (see Rule results), never because the entity is unavailable, missing, or under its duration after a restart.
- **A token leaking via the kiosk form** (logs, error messages, screenshots): the form uses a password-type input and never echoes the value; tests assert error text doesn't contain it.
