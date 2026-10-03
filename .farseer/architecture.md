# Architecture

A standalone React SPA that renders live Home Assistant state and calls HA actions over the WebSocket API. Phones first; a wall tablet in kiosk mode later. See `CLAUDE.md` for environment, deployment, and auth.

## Directory Structure

Target layout. Only `src/ha.ts`, `src/config.ts`, `src/storageKeys.ts`, `src/App.tsx` exist today; move them into `infrastructure/` and `app/` when the first feature lands (update the import in `e2e/fixtures.ts` too).

- `src/app/` - App shell: providers, layout, navigation, connection status banner.
- `src/features/<feature>/` - User-facing functionality (e.g. `home/`, `climate/`, `security/`). Composes domain components and selects which entities to show, using IDs from `src/config/`.
- `src/domains/<ha-domain>/` - One folder per HA entity domain (`light/`, `climate/`, `cover/`, `lock/`, `media_player/`, `sensor/`…). Each holds:
  - `types.ts` - the domain's state and attribute shapes.
  - `viewModel.ts` - pure functions from HA state to a UI view model.
  - `actions.ts` - domain actions (turn on, set temperature…) that go through the service gateway.
  - `factories.ts` - test factories for representative entity states.
  - `components/` - presentational components that take view models (e.g. `LightTile.tsx`).
- `src/infrastructure/` - Everything that touches HA or the browser platform: connection and auth (`ha/`), the entity store and selector hooks, the service gateway, runtime config (`config.json`), localStorage keys.
- `src/config/home.ts` - Typed, committed entity configuration: which `entity_id`s each feature uses. Not secret.
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
9. HA service calls go through domain actions, which call a service gateway. The gateway is the only code that calls `callService`. It has a real implementation (WebSocket) and a fake one (tests, demo mode).
10. Pending feedback after a tap (spinner, disabled control) lives in the domain action's state, never as an optimistic copy of the entity. The entity changes when HA says it changed.
11. Entity IDs come from `src/config/home.ts` rather than being scattered through components.
12. `unavailable` and `unknown` are first-class states in every view model. A configured entity that doesn't exist in HA renders a visible "missing" state; never crash, never guess.

### Testing

13. Business and domain logic gets Vitest tests.
14. React behavior gets Testing Library tests.
15. Critical user workflows get Playwright tests.
16. Playwright mocks Home Assistant at the WebSocket boundary for most tests. A small set of `@live` tests runs against the real instance to catch auth and protocol drift; they only read, never call services.
17. E2E tests use accessible, user-facing selectors rather than DOM structure.
18. Every HA domain gets test factories for representative entity states. The same factories feed Vitest tests, the Playwright WebSocket mock, and the `?demo` mode, so there's one fake HA, not three.

## Key Integrations

- **Home Assistant WebSocket API** via `home-assistant-js-websocket`: auth (`getAuth` OAuth for phones, `createLongLivedTokenAuth` for kiosk and tests), `createConnection` (auto-reconnect, resubscribes), `subscribeEntities`, `callService`. Check the live instance or current docs before relying on message shapes; they change between releases.
- **Runtime config**: `config.json`, written by the container at startup from `HA_URL`; in dev, `VITE_HA_URL` from `.envrc`.
- **Tailscale**: the app is served at `https://maplefrontier.alpine-ling.ts.net` by a sidecar; HA is a different origin.

## Kiosk and long-lived sessions

- No hover-only UI. Touch targets at least 44×44 CSS px.
- Survive network drops and HA restarts without a reload (the library reconnects; the UI shows connection state).
- `index.html` is never cached, so a reload picks up a new deploy.
