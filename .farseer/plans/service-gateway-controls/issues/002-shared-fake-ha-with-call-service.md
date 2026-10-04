# Task 002: Shared Fake HA with call_service

**Status**: completed
**Issue**: #19
**Depends on**: none
**Retry count**: 0

## Description

Move the protocol logic out of `e2e/haMock.ts` into a pure-TS fake HA core under `src/infrastructure/fakeHa/`, so the Playwright mock and demo mode (task 009) share one fake HA. Teach it `call_service`: record the call, apply on/off/toggle to light, switch, and fan entities, stamp scenes, and fail chosen HA actions on request. `HaMock` becomes a thin adapter from `WebSocketRoute` to the core, and its public API doesn't change.

## Context

- Related files:
  - New: `src/infrastructure/fakeHa/fakeHa.ts` (+ `fakeHa.test.ts`)
  - Modify: `e2e/haMock.ts` (delegate message handling and state to the core; keep `HaMockOptions`, `setState`, `removeEntity`, `sent`, `drop`, `stall`, `setReachable`, `userData`, `systemData`, `statistics`, `authTokens`, `sendFromAnotherClient`)
  - Reference: the `handle()` switch in `e2e/haMock.ts` (supported_features, ping, auth/current_user, subscribe_entities, frontend user/system data get/subscribe/set, recorder/statistics_during_period, unsubscribe_events)
- Constraints: the core is imported by `e2e/` through `tsconfig.node.json`, so it uses explicit `.ts` extensions on relative imports, `import type` for library types, and no browser or Playwright globals (same rules as `src/domains/factories.ts`). It is infrastructure, so it must not import domains or features: entities come in as `HassEntity[]`.
- The core talks in messages: it takes a parsed client message plus a per-client "send" callback and holds subscriptions per client. Auth stays in the adapters, since demo mode has no auth step.
- `call_service` semantics (enough for the controls in this plan, not a full HA):
  - `light|switch|fan` × `turn_on|turn_off|toggle` on an existing entity → state `on`/`off`, `last_changed`/`last_updated` now, broadcast as a `c` event
  - `scene.turn_on` → the scene's state becomes the current ISO timestamp (HA's scene state)
  - `script.turn_on` and anything else on an existing entity → recorded, success, no state change
  - an entity that doesn't exist → error result `not_found`
  - an option such as `failServices: ['switch.turn_off']` → error result for matching `domain.service`
- `e2e/fixtures.ts`'s `liveTest` guard (`FORBIDDEN`) must keep blocking `call_service`; don't touch it.
- **Wire details (review I11).**
  - Target entities come from `target.entity_id` (a string or an array; apply to each). Fall back to `service_data.entity_id`. The library always sends `target` and leaves `service_data` out when it's undefined.
  - For a call that changes state, broadcast the `c` event first, then send the result, as HA usually does.
  - `last_changed` moves only when the state value changes (`turn_on` on an already-on light only bumps `last_updated`).
  - The core exposes `connect(send)` → client and `disconnect(client)`, which drops that client's subscriptions. `HaMock.drop()` and the demo socket's `close` (task 009) call `disconnect`. A stalled client keeps its subscriptions, but its send callback drops everything.
  - The core holds entities, user/system data, statistics, and the user (for the `set_system_data` admin check). Serving `/home.json` and `/config.json` and the auth handshake stay in the `HaMock` adapter, since the core must not import `src/config/`.
- `calmHouse()` doesn't include action targets (the garage opener, scenes, reset scripts). Don't add them there (other specs count entities); later tasks seed them per spec.

## Requirements (Test Descriptions)

- [x] `it turns a light on when it receives light.turn_on for that entity`
- [x] `it flips a switch when it receives switch.toggle`
- [x] `it broadcasts the changed entity to every subscribe_entities client`
- [x] `it sets a scene's state to the activation time on scene.turn_on`
- [x] `it answers not_found when call_service targets an entity it doesn't have`
- [x] `it answers with an error for an HA action listed in failServices`
- [x] `it records every call_service message it receives`
- [x] `it applies a call to every entity in a target entity_id list`
- [x] `it sends the state change before the call_service result`
- [x] `it stops sending to a client after it disconnects`

## Acceptance Criteria

- All requirements have passing tests
- The existing Playwright suite passes unchanged: `npm run test:e2e -- --grep-invert @live`
- `e2e/haMock.ts` holds no protocol `switch`; it adapts `WebSocketRoute` to the core
- `HaMockOptions` gains `failServices?: string[]`
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Core: `src/infrastructure/fakeHa/fakeHa.ts` (`FakeHa`: `connect(send)`, `disconnect(client)`, `receive(client, msg)`, `stall()`, `setState`, `removeEntity`, `getState`, `sent()`, `user`, `userData`, `systemData`, `statistics`; option `failServices`). Imports only library types.
- `e2e/haMock.ts` is a thin `WebSocketRoute` adapter (auth handshake, `/home.json`, `/config.json` stay there); `drop()` disconnects each client.
- Extra tests: `service_data.entity_id` fallback; `last_changed` moves only on a state value change.
- Mock e2e suite: 75 passed, 5 skipped.
