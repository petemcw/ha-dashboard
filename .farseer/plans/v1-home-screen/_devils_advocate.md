# Devil's Advocate Review: v1-home-screen

Reviewed 2026-10-03 against the repo at `bdd4191`, `home-assistant-js-websocket` 9.7.0 in `node_modules`, and the Playwright 1.63 types. Nothing was sent to HA.

## Critical (Must fix before building)

### C1. `npm run build` fails once e2e imports the domain factories (003, 005, 006, 009, 013)

`tsconfig.json` references `tsconfig.node.json`, which includes `e2e/` with `module: nodenext` and `lib: ["ES2023"]` (no DOM). `npm run build` runs `tsc -b`, so it type-checks every `src/` file that `e2e/haMock.ts` pulls in under nodenext rules. Our `src/` code uses extensionless relative imports (`from './config'`). I reproduced this in a scratch copy: `src/domains/light/factories.ts` importing `'../factories'` fails with TS2835 ("Relative import paths need explicit file extensions"). A factory that touches `localStorage`, `location`, or `import.meta.env` would also fail, because that config has no DOM or Vite types.

**Fix applied:** 003 and the plan now set an import rule for factories and anything they import. Relative imports use explicit `.ts` extensions, imports from `home-assistant-js-websocket` are `import type` only, there are no browser globals or `import.meta.env`, and `npx tsc -p tsconfig.node.json --noEmit` must pass. Tasks 005, 006, 009, and 013 point to the rule.

### C2. Snooze cleanup can delete every shared snooze (008)

Cleanup removes a snooze when "its item is no longer active". In three common cases an item is inactive even though its alert hasn't resolved:

- **Before the first entity snapshot.** The store is empty, so no item is active and an admin client wipes all snoozes on every page load. The 5 s debounce only helps if the debounced call reads fresh state.
- **`unavailable`/`unknown`.** The 005 to 007 rules treat these as "not active". A dead camera battery, which is the main example in story 18, usually flaps to `unavailable`. That drops the snooze, and the alert comes back the next time the sensor reports 0%.
- **After an HA restart.** `last_changed` resets, so a garage door that is still open falls under its 10-minute threshold and goes "inactive". Its snooze is dropped even though nothing changed.

Story 21 says "dropped as soon as its alert *resolves*". Inactive isn't the same thing as resolved.

**Fix applied:** 005 defines a rule result of `{ items, resolvedIds }`. An id is resolved only when its entity is present and available and the condition has cleared: off or closed for left-on rules, numeric and at or above the threshold for thresholds, update not pending for updates. Being under a duration threshold doesn't count. 006 and 007 follow this contract. In 008, cleanup takes `resolvedIds`, never runs before the entity store and system data have both loaded, and only runs while connected. New 008 requirements cover the unavailable and pre-load cases.

## Important (Should fix before building)

### I1. Every configured entity shows as "missing" until the first snapshot arrives (001, 005, 009, 011)

The store starts empty, so `useEntity` reports every entity as missing until `subscribeEntities` emits. That flashes "Missing entity" chores and missing tiles on every load. It also makes mock specs racy and feeds C2.

**Fix applied:** 001's store exposes `isLoaded`, and `HomeScreen` renders a connecting placeholder instead of the regions until the first snapshot. There is a new requirement for this.

### I2. Selector hooks can loop forever if `getSnapshot` builds new values (001, 006, 012)

React's `useSyncExternalStore` takes no selector or equality function. A `getSnapshot` that returns a new array or view model on each call either triggers "The result of getSnapshot should be cached" or re-renders without end. This hits `useEntityIds(predicate)` (006) and the editor search (012) directly.

**Fix applied:** 001 says selectors return state objects by reference or primitives. I checked the library's `processEvent`: unchanged entities keep their identity, so reference equality is enough. View models are built in render. 006 says `useEntityIds` caches its array and returns the same reference while the ID set is unchanged, and the predicate receives the state object, so 012 can match on `friendly_name`. 006 has a new requirement for this.

### I3. The coverage gate fails after the move (001)

`vitest.config.ts` gates `src/infrastructure/**` at 80%. Moving `src/ha.ts` and `src/config.ts` there brings in untested OAuth, token, and config code. `loadConfig` also branches on `import.meta.env.VITE_HA_URL`, which direnv sets locally and CI leaves unset, so a test can pass on the laptop and fail in CI.

**Fix applied:** 001 adds requirements for the moved connection and config code and says to use `vi.stubEnv` for `VITE_HA_URL`.

### I4. The mock fixture can't run without `HA_TOKEN`, and the kiosk spec can't opt out of a token (003, 004)

`e2e/fixtures.ts` overrides `page` and throws when `HA_TOKEN` is missing. Any `mockHa` fixture built on that `page` inherits the throw and the real token. 004's e2e needs a page with no token at all.

**Fix applied:** 003 splits the fixtures. A `liveTest` has the token and the guard. The mock `test` doesn't touch `HA_TOKEN` and has a `seedToken` option, which defaults to a dummy token and is set to `false` for 004.

### I5. Gaps in the mock protocol (003)

- When `VITE_HA_URL` is unset, `loadConfig` fetches `/config.json` from Vite, gets `index.html` back, and `res.json()` throws. The mock fixture has to serve `/config.json`.
- Person pictures resolve to the real HA host, so mock specs would make real HTTP requests to the house, and the initials-fallback test would depend on what that server returns. The fixture has to route HA-origin HTTP.
- `ping` must get `{type: 'pong'}`. A failed `result` rejects the ping promise, and the heartbeat added in 015 would treat that as a dead socket.
- After `mock.drop()`, the library opens a new socket, which goes through the route handler again. The mock needs a fresh handshake per socket, state that persists across sockets, and a full `a` event when the client resubscribes.

**Fix applied:** all four are written into 003.

### I6. The live read-only guard arrives last and only fails after the fact (014, 003)

- The guard is in 014, the final task. 008 (admin snooze cleanup that writes on its own), 011, and 012 all add writes earlier, and `npm run test:e2e` runs `@live` specs as the owner, who is an admin.
- As written, it records messages and "fails the test after". By then the message has already been forwarded to HA, so a real `call_service` would already have changed a device.
- The existing reconnect test registers its own `routeWebSocket`. A second route on the same URL can take the socket over and bypass the guard.
- Admin snooze cleanup can legitimately send `frontend/set_system_data` from a live smoke run whenever stale snoozes exist in the house. A guard that fails on any `frontend/set_*` would make `@live` pass or fail based on house state.

**Fix applied:** the guard moves into 003. It never forwards `call_service` or `frontend/set_*`. It answers them with an error `result`, records them, and fails the test on `call_service` and `frontend/set_user_data`. A blocked `frontend/set_system_data` is recorded as an annotation instead of a failure (see Q4). The fixture owns the only route and exposes `drop()`, and the smoke reconnect test uses that. The plan's Success Criteria and Risks were updated to match. 014 just uses the guard.

### I7. 014's live smoke depends on whether the TV is playing (013, 014)

013 hides the suggestions strip when there are no suggestions. 014 asserts that all five regions render against real HA, so the test only passes while the Apple TV is playing or paused. Nothing defines what attention shows when nothing needs attention either, so that region's presence is undefined too.

**Fix applied:** 005 keeps the attention region with a "Nothing needs attention" empty state. 014's live smoke asserts attention, presence, favorites, and crypto, and only checks suggestions if they're present. The section-order spec seeds a playing Apple TV in the mock.

### I8. The "Add favorites" button can't reach the settings sheet (011, 001, 002)

011's prompt opens the settings sheet, but 011 doesn't depend on 002, where the sheet is built, and features can't import from `src/app/`.

**Fix applied:** 001 has `HomeScreen` take `onOpenSettings` and pass it to the `FavoritesSection` stub. 002 wires it from `AppShell`. 011 now depends on 002.

### I9. Writes before load, over unknown versions, and while another write is in flight (008, 011, 012)

- The editor (012) and Snooze (008) use read-modify-write. If they run before the first `{value}` arrives, the result overwrites the stored list or snoozes with an almost empty value.
- "Unknown version → treat as empty and don't overwrite" doesn't say what the editor or Snooze should do in that case.
- "Save on each change" with clicks in quick succession computes each write from the subscribed value before the previous write echoes back. For example, an add followed quickly by a remove loses the add.

**Fix applied:** `useUserData` and `useSystemData` return `{ value, loaded }`. 011 shows no prompt before load. 012 and 008 disable writes until the value has loaded and while the stored version is unknown, and they disable their controls while a write is in flight. This follows principle 10: pending state goes in the action's state. There are new requirements in 012 and 008.

### I10. The kiosk flow conflicts with the existing `connect()` (004)

- `connect()` calls `resetAuth()` on `ERR_INVALID_AUTH`. That runs `location.replace(location.pathname)`, which drops `?kiosk` and sends the tablet to OAuth, the exact thing 004 is meant to prevent.
- `getConnection()` caches the rejected promise in `pending`, so a second token attempt on the same page load gets the same rejection.

**Fix applied:** 004 now says the kiosk path handles invalid auth itself without `resetAuth()`, and that `pending` must be resettable so the next attempt starts a new connection that the stores from 001 attach to.

### I11. The kiosk gets stuck after a cold start, and silent disconnects go undetected (new task 015)

- `createConnection` defaults to `setupRetry: 0` (`dist/index.js`). If the tablet boots while HA or the network is down, the first connect rejects with `ERR_CANNOT_CONNECT` and nothing retries, so the wall shows an error until someone reloads it.
- The library sends no keepalive. `ping()` exists, but nothing calls it. A half-open socket after a Wi-Fi change, or on a phone resuming from the background, never fires `close`, so the screen shows stale state with no banner.

`.farseer/domain.md` lists exactly this case ("a stuck or silent disconnect") as business-critical.

**Fix applied:** new task 015, "Connection resilience: startup retry and heartbeat", depends on 001, 002, and 003, and 014 now depends on it.

### I12. Missing-entity items have no id (005, 008)

Rule items have ids, but the missing-entity item doesn't. Snoozes and React keys both need one.

**Fix applied:** missing items use `missing:<entity_id>`.

### I13. Parallel tasks would all edit `e2e/home.spec.ts` (005, 009, 010, 011, 013)

Each task adds "one Playwright mock spec", and 005, 009, 010, and 013 can run at the same time. On a shared `master` checkout they'd conflict.

**Fix applied:** each feature task writes its own spec file (`e2e/attention.spec.ts` for the serialized 005 to 008 chain, plus `presence`, `crypto`, `favorites`, `suggestions`, and `kiosk`).

## Minor (Nice to address)

- **Ghost entities after a reconnect.** The library's `processEvent` merges the resubscribe `a` into the old map, so an entity removed while disconnected stays until reload instead of showing as missing. HA restarts that rename entities would hide the "missing" signal until then.
- **Clock skew.** A tablet clock behind HA's gives negative durations ("Open for -2 min"). Clamp at 0.
- **Theme flash.** The `data-theme` override is applied after React mounts, so a dark kiosk flashes light on load. A small inline script in `index.html` fixes that. Also set `color-scheme` per theme so form controls and scrollbars follow it.
- **Sign out doesn't revoke the refresh token at HA.** `resetAuth()` only clears local storage. `auth.revoke()` exists.
- **Factories count toward coverage.** `src/domains/**` coverage includes `factories.ts`, so unused builders lower function coverage.
- **No home for the generic favorite tile.** 011 doesn't say where the fan, cover, climate, lock, scene, and script tile lives (`src/domains/<x>/` for each, or a shared generic module).
- **Person pictures need the HA URL synchronously.** `loadConfig()` is async. 009 needs an infrastructure hook such as `useHaUrl()` that provides the URL once it's resolved.
- **Two tasks edit the settings sheet composition.** 004 and 012 can run in parallel and both add a line where the sections are composed. The conflict is small.
- **014's grep for `call_service`** should also cover `callService`, the library export.
- **The toner link uses `target="_blank"`.** Some kiosk browsers block new windows or trap them.
- **The 1-day/1-week `until` uses device time.** Devices with skewed clocks disagree slightly on expiry.
- **Statistics as a non-admin.** `recorder/statistics_during_period` was checked with the owner token only. Recheck when a non-admin account exists.

## Questions for the Team

1. **Which HA user is the kiosk?** A long-lived token acts as the user who created it. With only the owner account, the kiosk shares the owner's favorites, is an admin, and runs snooze cleanup. `docs/feature-decisions.md` says the kiosk "has its own household list". Getting that needs a separate HA user (out of v1 scope), and a non-admin kiosk can't snooze.
2. **Should kiosk mode persist on the device?** 004 removes `?kiosk` after saving, so a later rejected or revoked token sends the wall tablet to HA's OAuth login. `App` also calls `resetAuth` on `reconnect-error`. Should a per-device "kiosk" flag keep it on the token form instead?
3. **Should the "Kiosk token" settings section show on OAuth phones?** Saving a token there switches the phone from the user's own login to the token's user.
4. **Live guard and admin cleanup.** I made the guard block `frontend/set_system_data` and record it as an annotation instead of failing the test, because admin snooze cleanup can legitimately try to write during a live run. Is that acceptable, or should live runs disable cleanup entirely (for example with a test-only flag)?
5. **What should attention say when it's empty?** I used "Nothing needs attention". Change the wording if you prefer something else.
6. **Publishing these tasks as GitHub issues.** 001 and 009 list presence and garage-door entity IDs. They're already public in `docs/feature-decisions.md`, but `.farseer/issue-tracker.md` asks to keep them out of issues. Redact them when publishing.
