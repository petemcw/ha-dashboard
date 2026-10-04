# 1. Demo mode runs the real gateway over one shared fake HA

Date: 2026-10-03
Status: accepted

## Context

Controls send HA actions to a real house. We need a way to tap them without touching a device. The glossary first described demo mode as "a fake gateway". Tests already had a fake HA in the Playwright WebSocket mock, and the Vitest tests had a separate fake connection.

## Decision

Demo mode (`?demo`) runs the real service gateway, the real entity store, and the real `home-assistant-js-websocket` library over an in-browser socket that talks to one shared fake HA (`src/infrastructure/fakeHa/`). The Playwright mock (`e2e/haMock.ts`) is a thin adapter over the same fake HA.

- `?demo` applies per page load and is never stored.
- `installDemoConnection` swaps in the demo connection. `getConnection()` fails closed: a demo page rejects instead of reaching the real HA.
- `useHaUrl` returns `location.origin`, the home config is `testHomeConfig`, and sign-out and kiosk token settings are hidden. `?demo` wins over `?kiosk`.
- The demo code lives in `src/app/demo/` and loads through a dynamic import.

## Alternatives considered

- **A fake `ServiceGateway` in demo mode.** The calls would never cross the protocol, so the demo would not exercise the connection-status check, error handling, or entity updates coming back from HA. State would need a second update path.
- **Separate fakes for tests, Playwright, and demo.** Three fakes drift apart. Principle 18 asks for one.

## Consequences

- A demo tap goes through the same code path as a real one. Failures (`failServices`), latency (`responseDelayMs`), and call assertions (`onServiceCall`) are available to tests.
- The fake HA must speak enough of the protocol for the library: auth, `subscribe_entities`, `call_service`.
- `testHomeConfig` ships in the main bundle, because `App.tsx` imports it.
- Only `src/infrastructure/serviceGateway/` may import `callService` (`oneGateway.test.ts` enforces it).
