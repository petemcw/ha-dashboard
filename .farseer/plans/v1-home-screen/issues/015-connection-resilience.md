# Task 015: Connection resilience: startup retry and heartbeat

**Status**: pending
**Depends on**: 001, 002, 003
**Retry count**: 0

## Description

Make the connection recover on its own in the two cases the library doesn't handle: HA or the network being down when the app starts, and a socket that dies silently without a `close` event. The kiosk runs for weeks and phones resume from the background, and `.farseer/domain.md` lists "a stuck or silent disconnect" as business-critical.

## Context

- Related files: `src/infrastructure/ha/connection.ts`, `src/infrastructure/ha/connectionStatus.ts`, `src/app/ConnectionBanner.tsx` (002), `e2e/haMock.ts` (003 answers `ping` with `pong`)
- Verified in `node_modules/home-assistant-js-websocket` 9.7.0:
  - `createConnection` defaults to `setupRetry: 0` (`dist/index.js`). If the first connect can't reach HA, it rejects with `ERR_CANNOT_CONNECT` and nothing retries. `setupRetry: -1` retries every second until it connects, and still rejects at once on `ERR_INVALID_AUTH` (`dist/socket.js`).
  - The library has `conn.ping()` but never calls it. A half-open socket (Wi-Fi change, phone suspended) can go minutes without a `close`, so the `disconnected` event and the banner never fire.
- Startup: pass `setupRetry: -1` to `createConnection`. While it retries, the status stays `connecting` and the shell shows "Can't reach Home Assistant. Retrying…" (no `role="alert"` flood). Config load failures (`/config.json`) and invalid auth stay terminal errors as in 001.
- Heartbeat: once connected, send `conn.ping()` every 30 s. If no `pong` arrives within 10 s, call `conn.reconnect(true)`, which fires `disconnected` so the banner from 002 shows. Also ping right away on `visibilitychange` to visible and on the window `online` event, so a phone that comes back from the background notices a dead socket in seconds. Stop the timer when the connection closes for good (`closeRequested`).
- Keep the timer and listeners in infrastructure; inject the clock (fake timers in Vitest).
- Don't log the token or the auth payload when reporting failures.

## Requirements (Test Descriptions)

- [ ] `it keeps retrying when Home Assistant is unreachable at startup and connects once it is back`
- [ ] `it still reports an error at once when Home Assistant rejects the credentials at startup`
- [ ] `it forces a reconnect when a ping gets no pong within 10 seconds`
- [ ] `it pings as soon as the page becomes visible again`
- [ ] `it stops pinging after the connection is closed`

## Acceptance Criteria

- All requirements have passing tests (Vitest with a fake `Connection` and fake timers; one Playwright mock spec in `e2e/connection.spec.ts` where `mock.stall()` leaves the socket half-open, the banner appears, and it clears once the forced reconnect gets a fresh socket. Use `page.clock` so the spec doesn't wait 40 s)
- Coverage ≥ 80% for `src/infrastructure/ha`
- `e2e/smoke.spec.ts` live reconnect test still passes
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
