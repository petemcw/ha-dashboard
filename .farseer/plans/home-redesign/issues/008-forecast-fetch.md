# Task 008: Forecast Subscription and Fake HA Forecasts

**Status**: pending
**Depends on**: none
**Retry count**: 0

## Description

Add infrastructure that subscribes to a weather entity's forecast over HA's `weather/subscribe_forecast` WebSocket subscription, which is what HA's own frontend uses, plus a hook that exposes it. Teach the shared fake HA to answer that subscription and push updates, so Vitest, Playwright, and demo mode can serve forecasts. No `call_service` is sent, so the service gateway, the `@live` read-only guard, and the mocked specs' service-call assertions are untouched.

## Context

- Decided with the owner after the post-plan review: use the subscription, not polling `weather.get_forecasts`.
- Related files: `src/infrastructure/ha/statistics.ts` and `useHourlyMeans.ts` (for the hook's shape and connection access), `src/infrastructure/appData/appData.ts` (the existing `subscribeMessage` use), `src/infrastructure/fakeHa/fakeHa.ts` (`FakeHaOptions`, `handle()` message switch at about :150–209, how `subscribe_entities` pushes events), `e2e/haMock.ts` (the `HaMockOptions` `Pick`), `src/test/fakeConnection.ts`.
- **Verify the message first.** On the live instance (HA 2026.9.4), confirm `{type: 'weather/subscribe_forecast', entity_id, forecast_type: 'hourly' | 'daily'}` is accepted and pushes events shaped `{type: 'hourly' | 'daily', forecast: [...] | null}`. A read-only subscription is fine to try against the real house. Record what you saw in Implementation Notes. If the shape differs, follow the live shape.
- New `src/infrastructure/ha/forecast.ts`: `subscribeForecast(conn, entityId, type, onForecast)` uses `conn.subscribeMessage(callback, {type:'weather/subscribe_forecast', entity_id, forecast_type: type})` and returns the unsubscribe function. The library resubscribes after a reconnect (`resubscribe` defaults to true), so there's no timer and no `ready` handler. Parse each event defensively: a `null` or malformed `forecast` is ignored and doesn't wipe the last good forecast. Type entries as raw forecast entries (`datetime`, `condition`, `temperature`, `templow?`, `precipitation_probability?`…).
- New `useForecast(entityId, type)` hook: subscribes while mounted and while a connection exists, holds the last good forecast, returns `undefined` until the first event, and unsubscribes on unmount or when `entityId` changes. If the subscribe call is rejected (unknown entity, entity without that forecast type), the hook stays `undefined` and logs nothing to the user. The Today card simply shows no forecast.
- Fake HA: add `forecasts?: Record<string, { hourly?: unknown[]; daily?: unknown[] }>` keyed by entity_id. On `weather/subscribe_forecast`:
  - Unknown entity: fail like HA does (`not_found`).
  - Entity without that forecast type: fail like HA does (`forecast_not_supported`).
  - Otherwise acknowledge with `ok(null)` and immediately push `{type, forecast}` as an event on that subscription id.
  - Add `setForecast(entityId, type, forecast)` to push an update to live subscribers (for tests, and so demo mode could refresh).
  - `unsubscribe_events` already exists; make sure it also ends forecast subscriptions.
  - Add `forecasts` to the `HaMockOptions` `Pick`. `fakeHa.ts` is imported by `e2e/` through `tsconfig.node.json`, so keep its explicit `.ts` imports and `import type`.
- `subscribe_forecast` is not a `call_service`, so the `@live` guard in `e2e/fixtures.ts` (which blocks `call_service` and `frontend/set_*`) forwards it unchanged. Don't touch the guard.
- No change to principle 9 in `.farseer/architecture.md` is needed (nothing calls a service). Add `forecast.ts` to the infrastructure line in the directory structure if it lists `ha/` contents.

## Requirements (Test Descriptions)

- [ ] `it subscribes to the hourly forecast for a weather entity`
- [ ] `it delivers each forecast the subscription pushes`
- [ ] `it keeps the last good forecast when an event has no forecast`
- [ ] `it unsubscribes from the forecast when the card unmounts`
- [ ] `it answers a forecast subscription with the configured forecast in the fake HA`
- [ ] `it pushes a forecast update to subscribers in the fake HA`
- [ ] `it rejects a forecast subscription for an entity without that forecast type like HA does`

## Acceptance Criteria

- All requirements have passing tests
- The live message shape was checked on 2026.9.4 and recorded in Implementation Notes
- `npm run test:coverage` stays at or above 80% for `src/infrastructure/`
- No `call_service` message is sent for forecasts, and `e2e/fixtures.ts` is unchanged
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
