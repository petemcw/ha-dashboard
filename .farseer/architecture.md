# Architecture

A standalone React SPA that renders live Home Assistant state and calls HA actions over the WebSocket API. Phones first; a wall tablet in kiosk mode later. See `CLAUDE.md` for environment, deployment, and auth.

## Directory Structure

- `src/app/` - App shell: providers, layout, navigation, connection status banner.
  - `src/app/demo/` - Demo mode (`?demo`): `installDemo.ts`, `demoHouse.ts` (the seeded house), `DemoBadge.tsx`.
- `src/features/<feature>/` - User-facing functionality (e.g. `home/`, `climate/`, `security/`). Composes domain components and selects which entities to show, using IDs from `src/config/`.
- `src/domains/<ha-domain>/` - One folder per HA entity domain (`light/`, `climate/`, `cover/`, `lock/`, `media_player/`, `sensor/`…). Each holds:
  - `types.ts` - the domain's state and attribute shapes.
  - `viewModel.ts` - pure functions from HA state to a UI view model.
  - `actions.ts` - domain actions (turn on, set temperature…) that go through the service gateway. Domains that share a model share it at the top of `src/domains/`: light, switch, and fan use `onOff.ts` (view model) and `onOffActions.ts` (`setOnOff`), and get their own `actions.ts` only once they need more than on/off.
  - `factories.ts` - test factories for representative entity states.
  - `components/` - presentational components that take view models (e.g. `LightTile.tsx`).
- `src/infrastructure/` - Everything that touches HA or the browser platform: connection and auth (`ha/`), the entity store and selector hooks, the service gateway, the fake HA, runtime config (`config.json`), localStorage keys.
  - `src/infrastructure/serviceGateway/` - The only code that calls `callService`. `webSocketGateway` (singleton) and `createWebSocketGateway`, `ServiceGatewayProvider`/`useServiceGateway`, `useAction` (the one hook a control uses: enabled while connected, pending and error state, and `run`, which hands the action the provided gateway), and `ServiceCallError` (`'connection-lost' | 'rejected'`). It refuses to send unless the connection is `connected`; it never queues.
  - `src/infrastructure/fakeHa/` - One fake HA shared by tests, Playwright, and demo mode: `fakeHa.ts` (protocol core, `call_service`, `failServices`, `responseDelayMs`, `onServiceCall`) and `demoSocket.ts` (in-browser socket for the library).
- `src/config/` - Types and `parseHomeConfig` for the runtime `/home.json` (which `entity_id`s each feature uses; template in `home.example.json`, the real file is the owner's and not in the repo), the `HomeConfigProvider`/`useHomeConfig()` context, `loadHomeConfig`, and `testHomeConfig.ts` (placeholder house for tests).
- `src/test/` - Vitest setup and shared test helpers.
- `e2e/` - Playwright tests, fixtures, and the HA WebSocket mock.
- `deploy/`, `Dockerfile`, `.github/workflows/` - Image build and Compose deployment.

## Principles

### Structure

1. Feature folders organize user-facing functionality.
2. Domain folders encapsulate Home Assistant entity domains.
3. Imports flow one way: `app → features → domains → infrastructure`. Domains never import features; infrastructure never imports domains or features. `src/config/` is imported by `app` and `features` only; domains receive entity IDs as arguments.

### Data flow

4. Raw HA entities never become the UI's primary data model.
5. Pure functions transform entity state into UI view models.
6. React components receive view models, not arbitrary HA objects.
7. WebSocket and entity synchronization belong in infrastructure.
8. Do not duplicate HA entity state in React local state. Infrastructure holds the `subscribeEntities` map in one external store; components read it through per-entity selector hooks (`useSyncExternalStore` with a selector), so an update to one entity re-renders only the components that read it. Never pass the whole entity map down the tree.
9. HA service calls go through domain actions, which call a service gateway. The gateway is the only code that calls `callService`. There is one implementation, over the WebSocket. Demo mode and Playwright run it over the shared fake HA; unit and component tests pass a fake gateway (`src/test/fakeServiceGateway.ts`). It never queues: if the connection isn't `connected`, the call fails with `rejected` (nothing was sent, so a retry is safe); `connection-lost` means the socket dropped with the call in flight. `oneGateway.test.ts` enforces that only `src/infrastructure/serviceGateway/` imports `callService`. See `.farseer/adr/0001-demo-mode-shared-fake-ha.md`.
10. Pending feedback after a tap (spinner, disabled control) lives in the action's state (`useAction`), never as an optimistic copy of the entity. The entity changes when HA says it changed.
    Every control is also disabled when the entity it targets isn't `ok`. HA drops a missing or unavailable target, logs a warning, and still answers the call with success (`entity_service_call` in `homeassistant/helpers/service.py`, checked against 2026.9.4), so the call would look like it worked while nothing happened.
11. Entity IDs come from the runtime `home.json` (via `useHomeConfig()`) rather than being scattered through components.
12. `unavailable` and `unknown` are first-class states in every view model. A configured entity that doesn't exist in HA renders a visible "missing" state; never crash, never guess.

### Testing

13. Business and domain logic gets Vitest tests.
14. React behavior gets Testing Library tests.
15. Critical user workflows get Playwright tests.
16. Playwright mocks Home Assistant at the WebSocket boundary for most tests. A small set of `@live` tests runs against the real instance to catch auth and protocol drift; they only read, never call services.
17. E2E tests use accessible, user-facing selectors rather than DOM structure.
18. Every HA domain gets test factories for representative entity states. The same factories feed Vitest tests, the Playwright WebSocket mock, and the `?demo` mode, which all run on the shared fake HA in `src/infrastructure/fakeHa/`, so there's one fake HA, not three.

## Key Integrations

- **Home Assistant WebSocket API** via `home-assistant-js-websocket`: auth (`getAuth` OAuth for phones, `createLongLivedTokenAuth` for kiosk and tests), `createConnection` (auto-reconnect, resubscribes), `subscribeEntities`, `callService`. Check the live instance or current docs before relying on message shapes; they change between releases.
- **Runtime config**: `config.json`, written by the container at startup from `HA_URL`; in dev, `VITE_HA_URL` from `.envrc`.
- **Tailscale**: the app is served at `https://maplefrontier.alpine-ling.ts.net` by a sidecar; HA is a different origin.

## Kiosk and long-lived sessions

- No hover-only UI. Touch targets at least 44×44 CSS px.
- Survive network drops and HA restarts without a reload (the library reconnects; the UI shows connection state).
- `index.html` is never cached, so a reload picks up a new deploy.
