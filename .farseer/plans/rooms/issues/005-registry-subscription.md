# Task 005: Registry Store and Subscription

**Status**: completed
**Issue**: #49
**Depends on**: none
**Retry count**: 0

## Description

Load HA's area, floor, device, and entity registries into one infrastructure store, keep it current when HA fires a registry-updated event, and reload it after a reconnect. Start it with the session, next to `subscribeEntities`, so it runs in the app and in demo mode. The fake HA side (list messages, `subscribe_events`, events) is task 019; this task's tests run on `src/test/fakeConnection.ts`.

## Context

- Related files: new `src/infrastructure/registries/` (`registries.ts` for fetch and mapping, `registryStore.ts`, `startRegistries.ts`, `useRegistries.ts`), `src/infrastructure/ha/session.ts` (+ `session.test.tsx`), `src/test/fakeConnection.ts`.
- Messages (verified on HA 2026.9.4, not admin-gated): `config/area_registry/list`, `config/floor_registry/list`, `config/device_registry/list`, `config/entity_registry/list_for_display`. Events (in `SUBSCRIBE_ALLOWLIST`, so non-admins can subscribe): `area_registry_updated`, `floor_registry_updated`, `device_registry_updated`, `entity_registry_updated`. Subscribe with `conn.subscribeEvents(cb, eventType)` and refetch the affected list. Debounce bursts per list (e.g. 500 ms), because entity- and device-registry events come in floods during an integration reload.
- Map wire shapes into plain records here, and nowhere else:
  - `AreaRecord { areaId, name, icon?, floorId?, temperatureEntityId?, humidityEntityId? }`
  - `FloorRecord { floorId, name, level?, icon? }`
  - `DeviceRecord { id, areaId? }` (keep only what rooms need)
  - `EntityRecord { entityId, areaId?, deviceId?, icon?, hidden: boolean, category: boolean }` from `list_for_display`'s `{ei, ai, di, ic, hb, ec}` (`ec` present means a config or diagnostic entity).
- State: `{ kind: 'loading' } | { kind: 'ready', registries } | { kind: 'error' }`.
  - **Keep the last good data.** A refetch (after an event or a reconnect) never goes back to `loading`, and a failed refetch keeps the last `ready` registries. `error` only when nothing has ever loaded (e.g. an older HA without a message); the next `ready` event retries and recovers. Otherwise the selector and room card would vanish on every network blip on the kiosk.
  - An error must not break Home; rooms hide themselves on `error`.
- **Activation (where it starts):** `startSession` (`src/infrastructure/ha/session.ts`) calls `startRegistries(conn)` in its connect callback, right after `subscribeEntities`, and the returned stop function joins the existing cleanup. Demo mode and Playwright reach it through the same path.
- Reconnect: the library resubscribes events after a reconnect but doesn't refetch lists; listen for the connection's `ready` event and refetch all four.
- A rejected `subscribe_events` (an HA or fake that doesn't know it) is caught: the lists still load, they just don't refresh on events. No unhandled rejection.
- **Test infrastructure:** `src/test/fakeConnection.ts` has no `subscribeEvents`, and its `subscribeMessage` keeps one callback, so a second subscription would steal the entity events that `session.test.tsx`, `App.kiosk.test.tsx`, `App.homeConfig.test.tsx`, `useEntity.test.tsx`, and `serviceGateway.test.ts` depend on. Route subscriptions by message type (`subscribe_entities` vs. `subscribe_events` + `event_type`), add `subscribeEvents`, add a way to fire a registry event, and keep `emit`/`change` working. Those existing tests must pass unchanged apart from the fake. Tests that count `sent()` messages may now see the four registry lists; adjust them by filtering on type, not by index.
- The store is a module singleton (like `entityStore`); export a test-only reset so unit tests don't leak state into each other.
- Selector hook: `useRegistries()` via `useSyncExternalStore` (architecture principle 8).

## Requirements (Test Descriptions)

- [x] `it loads areas, floors, devices, and entity display records into the registry store`
- [x] `it maps list_for_display records into entity records with area, device, icon, hidden, and category`
- [x] `it refetches the area list when HA fires area_registry_updated`
- [x] `it collapses a burst of entity_registry_updated events into one refetch`
- [x] `it refetches every registry after the connection reconnects`
- [x] `it keeps the last loaded registries when a refetch fails`
- [x] `it reports an error state when a registry message is rejected before anything loaded, and recovers on the next reconnect`
- [x] `it starts the registry subscription with the session and stops it on cleanup`
- [x] `it keeps delivering entity updates while registry events are subscribed`

## Acceptance Criteria

- All requirements have passing tests
- Existing session, App, and entity-store tests pass
- Code follows code standards
- No decrease in test coverage (80% on `src/infrastructure/`)

## Implementation Notes
- Added `src/infrastructure/registries/` (registries, registryStore, startRegistries, useRegistries) and wired `startRegistries` into `startSession`.
- `fakeConnection` now routes `subscribeEvents` per event type (entity subscription untouched) and gains `resolveType`, `rejectType`, `countSent`, `fireEvent`, `eventSubscribeCalls`, `unsubscribed`, `eventSubscriptions.reject`.
- Refetch debounce is 500 ms per list; a failed refetch keeps the last ready data.
