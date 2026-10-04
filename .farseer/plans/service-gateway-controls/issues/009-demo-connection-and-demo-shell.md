# Task 009: Demo Connection and ?demo Mode Shell

**Status**: pending
**Issue**: #26
**Depends on**: 001, 002
**Retry count**: 0

## Description

Add `?demo` mode. When the URL has `?demo`, the app connects to an in-browser fake HA (the shared core from task 002) instead of the real one: no `/config.json`, no `/home.json`, no OAuth, and no stored tokens. It uses `testHomeConfig` and shows a visible Demo badge. The real library, `subscribeEntities`, and the real gateway run on top of it. Sign-out and kiosk token settings are hidden. This task builds the plumbing with a minimal entity set; task 010 adds the full demo house.

## Context

- Related files:
  - New: `src/infrastructure/fakeHa/demoSocket.ts` (adapts the core to the socket `createConnection` expects through its `createSocket` option: `send`, `close`, `addEventListener`/`removeEventListener`, `haVersion`, already authenticated) + test, `src/infrastructure/ha/demoMode.ts` (`isDemoMode()` from the URL, decided per page load and never stored), `src/app/demo/` (demo wiring, `DemoBadge`), `e2e/demo.spec.ts`
  - Modify: `src/infrastructure/ha/connection.ts` (demo connection injection, see below), `src/main.tsx` (install the demo connection before the first render), `src/app/App.tsx` (demo home config instead of `useLoadedHomeConfig()`; the kiosk token form never shows in demo), `src/app/AppShell.tsx` (badge; hide `SignOutSection` and `KioskTokenSection` in demo; they're composed here, not in `SettingsSheet.tsx`, which only renders `children`), `src/infrastructure/ha/useHaUrl.ts` (demo branch, see below)
  - Reference: `src/infrastructure/ha/session.ts` (`startSession(connect)`), `node_modules/home-assistant-js-websocket/dist/socket.js` and `connection.js` (what the socket must provide; check before relying on it), `src/features/home/presence/PresenceRow.tsx` (renders nothing until `useHaUrl()` resolves)
- **Getting the demo connection into `getConnection()` (review C1).** `connection.ts` is infrastructure and can't import `src/app/demo/`, and the demo chunk loads through a dynamic `import()`. `App`'s mount effect calls `startSession()` → `getConnection()`. If the demo chunk isn't installed by then, the real `connect()` runs: it fetches `/config.json`, reads tokens, and on a phone with no tokens `getAuth()` redirects to HA's login. So:
  - `connection.ts` exports `installDemoConnection(connect: () => Promise<Connection>)`. Once it's installed, `getConnection()` memoizes and returns it; `resetConnection()` never clears it.
  - `main.tsx` checks `isDemoMode()`, awaits the demo module, and installs the connection **before** `createRoot().render()`.
  - Fail closed: if `isDemoMode()` is true and nothing is installed, `getConnection()` rejects; it never falls back to the real `connect()`.
- **`useHaUrl` in demo (review C2).** `PresenceRow` calls `useHaUrl()` → `getConfig()` → a `/config.json` fetch, and it renders nothing until that resolves. In demo, `useHaUrl()` returns `location.origin` at once without calling `getConfig()`. Demo `person` entities have no `entity_picture` (task 010), so no picture request goes anywhere.
- **What the demo socket must provide (review I1).** Beyond `send`, `close`, `add/removeEventListener`, `haVersion`, `Connection` relies on:
  - `readyState` and `OPEN`/`CLOSED`: `Connection.connected` is `socket.readyState == socket.OPEN`.
  - `message` events whose `data` is a JSON **string**: `_handleMessage` calls `JSON.parse(event.data)`.
  - A `close` event fired asynchronously after `close()`, which drives `_handleClose` and the library's reconnect.
  - Replies delivered asynchronously (microtask or `setTimeout(0)`), never from inside `send()`: a synchronous reply re-enters `sendMessage`.
  - A `createSocket` that can be called again: the heartbeat's `conn.reconnect(true)` and any close call `options.createSocket` for a new socket. Each socket is a new core client; `close` calls the core's `disconnect(client)`.
  - Cast to `HaWebSocket` (`as unknown as HaWebSocket`); it isn't a real `WebSocket`.
- **The real gateway over the demo socket (review I2).** The requirement test runs `callService` through `createWebSocketGateway` from task 001, not through the library's `callService` (task 001's one-gateway check would fail). That proves the claim in the architecture notes.
- Load the demo modules with a dynamic `import()` only in demo mode, so the normal bundle path doesn't pull them in.
- `?demo` wins over `?kiosk`. Demo never writes `KIOSK_MODE_KEY` or token keys.
- **The e2e check (review I13).** The Playwright fixture installs the HA mock for every test. Playwright's `page.on('request')` doesn't report WebSockets, so the demo spec asserts all of these:
  - no `request` to `MOCK_HA_URL`, `/config.json`, or `/home.json`
  - no `page.on('websocket')` event
  - `mockHa.authTokens` and `mockHa.sent()` empty

## Requirements (Test Descriptions)

- [ ] `it runs createConnection, subscribeEntities, and the WebSocket gateway's callService over the demo socket`
- [ ] `it reconnects over a new demo socket after a forced reconnect and resumes subscribe_entities`
- [ ] `it never runs the real connect in demo mode, even before the demo connection is installed`
- [ ] `it shows people in demo mode without fetching config.json`
- [ ] `it connects to the fake HA without fetching config.json or reading stored tokens in demo mode`
- [ ] `it uses the placeholder home config instead of loading home.json in demo mode`
- [ ] `it shows a Demo badge in demo mode`
- [ ] `it hides sign out and kiosk token settings in demo mode`
- [ ] `it ignores ?kiosk when ?demo is present`
- [ ] `it leaves demo mode on the next load without ?demo`

## Acceptance Criteria

- All requirements have passing tests
- `e2e/demo.spec.ts` loads `/?demo` at both viewports, sees the Home screen and the Demo badge, and records no request to the HA origin
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
