# Task 019: Fake HA Registries, Events, and Service Data

**Status**: completed
**Issue**: #56
**Depends on**: none
**Retry count**: 0

## Description

Teach the shared fake HA what rooms need, so unit tests, Playwright, and demo mode all have it: the four registry list messages, `subscribe_events` with the four registry-updated events, service data on calls, and `input_boolean` on/off. Restructure service handling into a per-HA-domain table so the control tasks (014–017) each add their own entry instead of editing one shared function in parallel.

## Context

- Related files: `src/infrastructure/fakeHa/fakeHa.ts` (+ `fakeHa.test.ts`), `e2e/haMock.ts`, new `src/infrastructure/fakeHa/placeholderRegistries.ts`, `src/app/demo/demoHouse.ts` (only if the `onServiceCall` signature change needs it).
- The fake HA uses explicit `.ts` imports and no browser globals (Playwright imports it through `tsconfig.node.json`); keep that.
- **Registries:**
  - Options `areas`, `floors`, `devices`, `entityRegistry` in HA's wire shapes: areas `{area_id, name, icon, floor_id, temperature_entity_id, humidity_entity_id, aliases, labels, picture}`, floors `{floor_id, name, level, icon, aliases}`, devices `{id, area_id, …}`, and `list_for_display`'s `{entity_categories: {0: 'config', 1: 'diagnostic'}, entities: [{ei, pl, ai?, di?, ic?, hb?, ec?}]}`. Absent options answer empty lists.
  - Answer `config/area_registry/list`, `config/floor_registry/list`, `config/device_registry/list`, `config/entity_registry/list_for_display`. Any other `config/*` message stays `unknown_command`.
  - Handle `subscribe_events` (keyed by `event_type`; the existing `unsubscribe_events` case already drops any subscription id). A `setRegistry`-style helper replaces one registry and fires the matching `*_registry_updated` event to subscribers.
- **Placeholder registries** (`placeholderRegistries.ts`): the floors and areas listed under "Shared placeholder house for rooms" in `_plan.md`, plus a builder that turns `{ [areaId]: entityIds[] }` into devices and entity-registry records (some entities placed through their device's area, some directly), so a spec or the demo house picks its own entities. Generic names only (public repo).
- **`HaMock` default is empty registries.** Add `areas`, `floors`, `devices`, `entityRegistry` to `HaMockOptions`' `Pick`, defaulting to none. Existing specs then show no rooms and no selector, so `e2e/home.spec.ts`'s layout checks (Favorites level with Needs attention on a tablet) don't change. Rooms specs pass the placeholder registries.
- **Service data:** `ServiceCall` gains `serviceData: Record<string, unknown>` (from `service_data`, without `entity_id`), and `onServiceCall` receives it. Replace `applyService(entity, domain, service)` with a handler table keyed by HA domain: `(entity, call) => HassEntity`. Move today's scene and on/off behavior into it unchanged. 014 (light brightness), 015 (light color temp and color), 016 (media player transport and power), and 017 (volume) each add or extend one entry.
- **`input_boolean`:** on/off like `light`, `switch`, `fan` (today's `SWITCHABLE`).

## Requirements (Test Descriptions)

- [x] `it answers the four registry list messages from the fake HA's registries`
- [x] `it answers empty registry lists when none are configured`
- [x] `it sends a registry-updated event to subscribers when a registry changes`
- [x] `it stops sending events after unsubscribe_events`
- [x] `it passes service data to the service-call hook`
- [x] `it turns an input_boolean on and off in the fake HA`
- [x] `it builds placeholder entity records in their areas directly or through their device`

## Acceptance Criteria

- All requirements have passing tests
- Existing fake HA, demo, and Playwright mocked specs pass unchanged
- Code follows code standards
- No decrease in test coverage (80% on `src/infrastructure/`)

## Implementation Notes
- Registries live in `FakeHa` (`setRegistry(name, value)` fires `*_registry_updated` to `subscribe_events` subscribers; event payload `{event_type, data: {}, origin, time_fired}`). `HaMock` takes `areas/floors/devices/entityRegistry` via the options Pick; default empty.
- Service handling is now `SERVICE_HANDLERS` keyed by HA domain (`(entity, call) => HassEntity`); `ServiceCall.serviceData` added. 014-017 add entries there.
- `placeholderRegistries.ts`: `PLACEHOLDER_FLOORS`, `PLACEHOLDER_AREAS`, `placeRegistries({areaId: entityIds[]})` (alternates direct `ai` / via device `di`, starting direct).
- The older "unknown_command" test now uses `config/label_registry/list`.
- Run tests under `nvm use` (Node 24); the default node fails to start vitest.
