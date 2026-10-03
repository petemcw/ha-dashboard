# Task 003: Playwright HA WebSocket mock and live read-only guard

**Status**: complete
**Depends on**: 001
**Retry count**: 0

## Description

Add a Playwright fixture that replaces HA's WebSocket with an in-test mock speaking the real wire protocol, seeded with the same domain factories Vitest uses. It implements every message type v1 needs, so later tasks only seed state and assert. Mock-backed specs never need `HA_TOKEN` and can exercise writes (favorites, snoozes) safely.

Also add the read-only guard to the `@live` fixture now, before any task adds writes (snooze cleanup in 008 writes on its own for admin users, and `@live` runs as the owner, who is an admin). The guard blocks forbidden messages before they reach HA instead of failing after the fact.

## Context

- Related files: `e2e/fixtures.ts`, `e2e/smoke.spec.ts`, `playwright.config.ts`, `tsconfig.node.json`, `src/infrastructure/storageKeys.ts`, `.farseer/testing.md`
- New: `e2e/haMock.ts` (mock server over `page.routeWebSocket(/\/api\/websocket$/, …)` without `connectToServer`), `src/domains/factories.ts` (base `entityState({ entity_id, state, attributes, last_changed })` builder that per-domain factories extend), `e2e/home.spec.ts` (first mock spec).
- **Fixture split.** Today `e2e/fixtures.ts` overrides `page` and throws when `HA_TOKEN` is unset, so any fixture built on that `page` inherits the throw and the real token. Split it:
  - `liveTest`: the current `HA_TOKEN` injection plus the read-only guard below. `e2e/smoke.spec.ts` imports this.
  - `test` (mock): never reads `HA_TOKEN`. Provides `mockHa` and an option `seedToken` (default: a dummy token under `LONG_LIVED_TOKEN_KEY`; `false` seeds nothing, which task 004's kiosk spec uses).
- **Factory import rule** (affects every `factories.ts` and anything it imports). `npm run build` runs `tsc -b`, which type-checks `e2e/` through `tsconfig.node.json` (`module: nodenext`, `lib: ES2023`, no DOM, no Vite types) and follows imports into `src/`. Under nodenext, an extensionless relative import fails with TS2835 (reproduced). So factories and their imports: use explicit `.ts` extensions on relative imports, import from `home-assistant-js-websocket` with `import type` only, and use no browser globals or `import.meta.env`. Check with `npx tsc -p tsconfig.node.json --noEmit`.
- **Runtime config and HTTP.** The mock fixture serves `/config.json` (`{ haUrl: 'http://ha.mock.test' }`) with `page.route`, because without `VITE_HA_URL` (e.g. outside direnv), Vite answers `/config.json` with `index.html` and `res.json()` throws. It also routes every HTTP request to the HA origin (person pictures from 009, anything else) to a local fixture response, so mock specs never reach the real house.
- Protocol (verify against `node_modules/home-assistant-js-websocket` and the live instance before relying on details):
  - On open send `{type: 'auth_required', ha_version: '2026.9.4'}`; on `{type: 'auth'}` reply `{type: 'auth_ok', ha_version}`. The library then sends `supported_features` with id 1 → `result` success.
  - `ping` → `{id, type: 'pong'}` (not a `result`; a failed `result` rejects the ping and task 015's heartbeat would treat the socket as dead).
  - `subscribe_entities` → `result` then an event with `{a: {<entity_id>: {s, a, lc, lu, c}}}` (compressed). Changes → `{c: {<id>: {'+': {s, a, lc}}}}`; removals → `{r: [ids]}`. `lc`/`lu` are epoch seconds.
  - `auth/current_user` → `{id, name, is_admin, is_owner}` (configurable per test).
  - `frontend/get_user_data`, `frontend/subscribe_user_data`, `frontend/set_user_data` (in-memory, per mock user; subscribers get `{value}` on subscribe and after each set).
  - `frontend/get_system_data`, `frontend/subscribe_system_data`, `frontend/set_system_data` (in-memory; `set` returns an error `{code: 'unauthorized'}` when the mock user isn't admin).
  - `recorder/statistics_during_period` → `{<statistic_id>: [{start, end, mean}]}` (ms timestamps) from seeded series.
  - Any other message type → `result` with `success: false` and code `unknown_command`, recorded so tests can assert on it.
- **Reconnects.** After `mock.drop()` the library opens a new socket, which reaches the route handler again. Each socket gets its own handshake and message ids. Entity, user-data, and system-data state live on the mock (not the socket) and survive the drop. Resubscribed `subscribe_entities` gets the full `a` again.
- Test controls: `mock.setState(entity)`, `mock.removeEntity(id)`, `mock.drop()` (close the socket to trigger reconnect), `mock.stall()` (stop answering anything, including `ping`, without closing: a half-open socket for task 015), `mock.sent()` (every message the page sent), `mock.userData`, `mock.systemData`.
- **Live read-only guard** (in `liveTest`): the fixture owns the only route for the socket, `page.routeWebSocket(/\/api\/websocket$/, ws => { const server = ws.connectToServer(); ws.onMessage(…); … })`. Once `onMessage` is set, messages aren't forwarded automatically, so forward each one yourself after checking it:
  - `call_service` and any `frontend/set_*`: **never forwarded**. Reply to the page with `result` `success: false` (code `blocked_by_test`) and record it.
  - After the test: fail if any `call_service` or `frontend/set_user_data` was recorded. A blocked `frontend/set_system_data` (admin snooze cleanup can legitimately try one) is added as a test annotation, not a failure.
  - Self-test the guard with `test.fail()`: open a raw `WebSocket` to the HA URL from `page.evaluate` and send a `call_service`. The guard blocks it before `server.send`, so nothing reaches HA. Never self-test by driving the app's UI.
  - Expose `liveSocket.drop()` (closes the page side so the app reconnects through the guard again). Tests must not register their own `routeWebSocket`: a second route on the same URL can take the socket and bypass the guard. Move the existing reconnect test in `e2e/smoke.spec.ts` to `liveSocket.drop()`.
- Later tasks put their mock specs in their own files (`e2e/attention.spec.ts`, `e2e/presence.spec.ts`, `e2e/crypto.spec.ts`, `e2e/favorites.spec.ts`, `e2e/suggestions.spec.ts`, `e2e/kiosk.spec.ts`) so parallel workers don't edit the same spec.

## Requirements (Test Descriptions)

- [x] `it renders the home screen against the mocked HA without a real token`
- [x] `it shows an entity change pushed by the mock without a reload`
- [x] `it shows the reconnecting state after the mock drops the socket, then recovers`
- [x] `it records every message type the page sends`
- [x] `it rejects set_system_data from a non-admin mock user`
- [x] `it answers ping with pong`
- [x] `it never forwards call_service or a frontend set message to the real Home Assistant`
- [x] `it fails a live test that sends call_service`

## Acceptance Criteria

- All requirements have passing tests at the `phone` and `tablet` projects
- `npm run test:e2e -- --grep-invert @live` runs without `HA_TOKEN` or `VITE_HA_URL` set
- `npm run test:e2e -- --grep @live` still passes, including the reconnect test through `liveSocket.drop()`
- `npx tsc -p tsconfig.node.json --noEmit` and `npm run build` pass with `e2e/haMock.ts` importing the factories
- Factories used by the mock are importable from Vitest tests too (no Playwright imports in `src/`)
- Code follows code standards

## Implementation Notes

- `e2e/haMock.ts`: `HaMock` class (state on the mock, per-socket handshake/subs), installed by the `mockHa` fixture which also serves `/config.json`, 404s everything on `http://ha.mock.test`, and seeds the dummy token (`seedToken` option; `false` seeds nothing). `haOptions` option seeds user/entities/statistics.
- `e2e/fixtures.ts`: `test` (mock) and `liveTest` (HA_TOKEN + auto `liveSocket` guard with `drop()`, `takeBlocked()`). Blocked `set_system_data` becomes an annotation; `call_service`/`set_user_data` fail the test in teardown.
- `src/domains/factories.ts`: base `entityState` (type-only lib import, no browser globals).
- Page-side checks that have no UI yet (change push, ping, non-admin set) use a raw WebSocket from `page.evaluate` against the mock; swap for UI assertions once later tasks render entities.
- Guard self-tests live in `e2e/smoke.spec.ts` (raw WS needs `HA_URL` from direnv).
- Verified: mock specs pass without HA_TOKEN/VITE_HA_URL; @live passes; tsc node config and build pass.
