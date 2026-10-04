# Task 001: Move scaffold into target layout with entity store and config

**Status**: done
**Depends on**: none
**Retry count**: 0

## Description

Pre-factoring for every other task. Move the scaffold into the layout from `.farseer/architecture.md`, replace `App.tsx`'s local entity state with an infrastructure entity store read through per-entity selector hooks, add a connection status store, and write `src/config/home.ts` with every v1 entity ID and threshold. The page renders a `HomeScreen` with one empty, labelled region per section so later tasks fill their own region without touching each other's code.

## Context

- Related files: `src/ha.ts`, `src/config.ts`, `src/storageKeys.ts`, `src/App.tsx`, `src/main.tsx`, `e2e/fixtures.ts` (imports `storageKeys`), `e2e/smoke.spec.ts`, `docs/feature-decisions.md`, `.farseer/plans/v1-home-screen/_plan.md`
- Target paths:
  - `src/infrastructure/ha/connection.ts` (was `src/ha.ts`), `src/infrastructure/ha/runtimeConfig.ts` (was `src/config.ts`), `src/infrastructure/storageKeys.ts`
  - `src/infrastructure/entities/entityStore.ts` + `useEntity.ts` (`useSyncExternalStore` with a selector)
  - `src/infrastructure/ha/connectionStatus.ts` + `useConnectionStatus.ts`: `connecting` | `connected` | `reconnecting` | `error`
  - `src/app/App.tsx`, `src/features/home/HomeScreen.tsx` (regions: attention, suggestions, presence, favorites, crypto). Each region is a stub component in its own file that renders an empty `<section aria-label=…>`: `attention/AttentionSection.tsx`, `suggestions/SuggestionsStrip.tsx`, `presence/PresenceRow.tsx`, `favorites/FavoritesSection.tsx`, `crypto/CryptoRow.tsx` (all under `src/features/home/`). Later tasks replace their own stub, so parallel tasks don't edit `HomeScreen.tsx`.
  - `src/config/home.ts`
- Patterns to follow: comment tone in `src/ha.ts`; storage access wrapped in try/catch.
- Keep the existing visible strings "Connection lost. Reconnecting…" and an error `role="alert"` so `e2e/smoke.spec.ts` keeps passing; update the smoke test's "Connected to Home Assistant … / N entities" assertion to assert the home screen heading instead. Task 002 replaces the status text with the banner.
- Entities: `subscribeEntities` returns `HassEntities`; the store holds that map and notifies per-entity subscribers. Test with a fake `Connection` at the library boundary (see `.farseer/testing.md`).
- **Snapshot stability.** React's `useSyncExternalStore` has no selector or equality argument. A `getSnapshot` that returns a new object or array on each call warns ("The result of getSnapshot should be cached") and can re-render without end. Selector hooks return the state object by reference (or a primitive), and view models are built in render (`useMemo` if needed). The library's `processEvent` keeps the object identity of unchanged entities across emissions, so reference equality is enough. Task 006 adds a derived-list selector that caches its array.
- **Loaded gate.** The store exposes `isLoaded` (true after the first `subscribeEntities` emission). Until then, `HomeScreen` renders a "Connecting…" placeholder instead of the regions, so no entity is reported missing before HA has sent the map. After a reconnect the store keeps the last map (stale, not empty).
- **Settings hook-up.** `HomeScreen` takes `onOpenSettings?: () => void` and passes it to the `FavoritesSection` stub. Task 002 wires it from the shell; task 011 uses it for the "Add favorites" button. Features can't import from `src/app/`, so the callback is the only path.
- **Connection start.** Start the connection from `App`'s effect through `getConnection()`, never as a side effect of importing a module. Task 004 needs to render the kiosk form before any connection or OAuth starts.
- **Coverage.** Moving `src/ha.ts` and `src/config.ts` into `src/infrastructure/` puts them under the 80% gate in `vitest.config.ts`, and they have no tests today. Cover them with tests at the library and `fetch` boundaries. `loadConfig` branches on `import.meta.env.VITE_HA_URL`, which direnv sets locally but CI leaves unset, so stub it with `vi.stubEnv`/`vi.unstubAllEnvs`. Otherwise tests pass locally and fail in CI, or the other way round.
- `src/config/home.ts` contents (the real entity IDs were checked live on 2026-10-03 and now live in the runtime `home.json`, not the repo; see `docs/feature-decisions.md`):
  - `leftOnRules`: the garage door sensor (on = open, 10 min), a work-lights smart plug (30 min), a space heater switch (60 min), and a bedroom lightstrip (30 min). Each has an `id`, a label, and the disabled action it will get later (door: `switch.toggle` on the opener switch, a different entity from the sensor; others: turn off the same entity).
  - `batteryRule`: threshold 20, with an ignore list of phone and tablet battery sensors.
  - `updateRules`: two `update` entities (state `on`) and an update-available `binary_sensor` (state `on`, label "Home Assistant Docker image").
  - `tonerRule`: the printer's ink sensor below 15, with a reorder URL.
  - `filterRules` (below 5 days): three filter days-remaining sensors (HVAC and two refrigerator filters), each mapped to its own reset script.
  - `suggestions`: the TV media player; playing → a lights-down scene ("Media viewing mood", transition 5); paused → a lights-up scene ("Bright up lights").
  - `people`: the household's `person` entities (placeholders in tests: `person.alex_rivera` and similar).
  - `crypto`: three exchange-rate sensors (BTC, ETH, SOL).
  - `favoriteDomains`: `light`, `switch`, `fan`, `media_player`, `cover`, `climate`, `lock`, `scene`, `script`.
  - Config types live in `src/config/` (config must not import from features).

## Requirements (Test Descriptions)

- [x] `it gives a selector subscriber the current state of its entity`
- [x] `it re-renders a component only when the entity it reads changes`
- [x] `it reports an entity that is not in the map as missing`
- [x] `it does not report entities as missing before the first entity snapshot arrives`
- [x] `it reports reconnecting when the connection emits disconnected`
- [x] `it reports connected again when entities are re-emitted after a reconnect`
- [x] `it reports an error with a readable message when the first connection fails`
- [x] `it renders the home screen with a labelled region for each section`
- [x] `it connects with a stored long-lived token instead of the Home Assistant login`
- [x] `it clears stored credentials when Home Assistant rejects them`
- [x] `it reads the Home Assistant URL from config.json when VITE_HA_URL is not set`

## Acceptance Criteria

- All requirements have passing tests
- `src/ha.ts`, `src/config.ts`, `src/storageKeys.ts`, `src/App.tsx` no longer exist at the old paths; `e2e/fixtures.ts` imports the new `storageKeys` path
- No component holds a copy of HA state in `useState`
- `npm run test:e2e -- --grep @live` still passes
- `npm run test:coverage` passes with `src/infrastructure/**` at or above 80%, with `VITE_HA_URL` both set and unset
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Moved scaffold to `src/infrastructure/ha/{connection,runtimeConfig}.ts`, `src/infrastructure/storageKeys.ts`, `src/app/App.tsx`; updated `e2e/fixtures.ts`, `main.tsx`, CLAUDE.md path.
- New: `infrastructure/store.ts` (generic external store), `entities/entityStore.ts` + `useEntity.ts` (`useEntity`, `useEntitiesLoaded`), `ha/connectionStatus.ts` + `useConnectionStatus.ts`, `ha/session.ts` (`startSession(connect?)`: called from App's effect; wires entity store, status, reconnect-error). `src/test/fakeConnection.ts` fakes the Connection so the real `subscribeEntities` runs.
- `HomeScreen` shows h1 "Home" always, "Connecting…" until loaded, then five stub regions (aria-labels: Needs attention, Suggestions, People, Favorites, Crypto); `onOpenSettings` goes to FavoritesSection.
- `src/config/home.ts` holds all rules/IDs with types.
- Smoke e2e now asserts the Favorites region with `toBeAttached` (empty sections have zero size, so Playwright treats them as hidden) and the Home heading. Live e2e passes.
- Tests were written together with the code per slice, so the entity store tests passed on first run.
- Node 24 is not installed here; tests ran with Homebrew node 26 (nvm node 20 breaks jsdom).
- Coverage 81% overall with VITE_HA_URL set and unset; session.ts is 70% (App-level cleanup branches), infra total above 80%.
