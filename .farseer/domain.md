# Domain Context

Vocabulary and business rules for this project.

Use this language in class names, method names, test names, and issue titles. When a term here conflicts with a generic term, the domain term wins in naming.

If any of the mentioned files do not exist, **proceed silently**. Do not flag their absence; don't suggest creating them.

## Where domain knowledge lives

| Source                      | Contents                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `CLAUDE.md`                 | Environment, deployment, auth, rules for changing the house  |
| `.farseer/architecture.md`  | Structure and principles                                     |
| `.farseer/adr/`             | Architecture Decision Records (ADRs)                         |
| `home.json` (`src/config/` types) | Which entities the dashboard uses (runtime file; `home.example.json` is the template) |
| Live HA (via `ha-mcp`)      | The real entities, areas, and devices. Source of truth.      |

## Core Vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined here. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap and you should propose a new glossary entry.

### Glossary

- **Entity**: one HA thing with a state, identified by `entity_id` (`light.kitchen_island`). Avoid "device" for this; a device is different.
- **`entity_id`**: `<domain>.<object_id>`. Always taken from live data or `home.json`; never invented.
- **HA domain**: the part of `entity_id` before the dot (`light`, `climate`, `cover`). A `src/domains/<ha-domain>/` folder exists per HA domain we support. Say "HA domain" when "domain" alone could mean the business domain.
- **State object**: what HA sends for an entity: `state` (a string), `attributes`, `last_changed`, `last_updated`, `context`. "Raw entity" in code means this, before mapping.
- **Attributes**: the per-domain extra data on a state object (`brightness`, `current_temperature`).
- **Device**: physical or logical hardware in HA's device registry; can own many entities. Not the same as an entity.
- **Area / Floor**: HA's room and level groupings. Use HA's area names as the room vocabulary in the UI and in feature names.
- **HA action**: what HA now calls a service (`light.turn_on`). The WebSocket message is still `call_service`. In prose, say "HA action"; in code that wraps the wire call, "service" is fine (`ServiceGateway`, `callService`).
- **Domain action**: our function in `domains/<ha-domain>/actions.ts` that performs an HA action (`turnOnLight`). UI code calls domain actions, never the gateway or the connection.
- **Service gateway**: the single seam that sends HA actions. One implementation over the WebSocket (`src/infrastructure/serviceGateway/`). It refuses to send unless the connection is `connected` and never queues. Demo mode fakes HA underneath it; unit tests fake the gateway itself.
- **View model**: the plain, UI-ready object a pure function builds from a state object (`LightViewModel`). Components only see view models.
- **Entity store**: the infrastructure store holding the live entity map from `subscribeEntities`. Read through selector hooks.
- **Unavailable / unknown**: HA's special states when an integration can't reach a device (`unavailable`) or has no value yet (`unknown`). Every view model handles both.
- **Missing entity**: an `entity_id` in our config that doesn't exist in HA. Shown as missing, never guessed at.
- **Room**: an HA area that has something to control, plus the `home.json` `rooms` tweaks (hidden areas, entities added to or removed from an area). Rooms are not HA zones; avoid "zone", which in HA is a location used for presence.
- **Room source**: a rule Auto uses to pick a room (`RoomSource`). The only one now: the signed-in person is away, so show the `rooms.awayRoom` area. It never fires on a kiosk.
- **Room selection**: the per-device choice of Auto or one room, kept in localStorage. A pick whose area is no longer a room falls back to Auto.
- **Feature**: a user-facing area of the app (home overview, climate, security). Lives in `src/features/`.
- **Tile**: the compact, tappable representation of one entity on a screen.
- **Kiosk**: the wall tablet running the app full-screen for long periods, authenticated with a long-lived token.
- **Live test**: a Playwright test tagged `@live` that runs against the real HA instance. Read-only.
- **Demo mode**: the real app and the real gateway running over the shared fake HA (`?demo`), on placeholder-house data. It applies per page load and is never stored. For exercising controls without touching the house. See `.farseer/adr/0001-demo-mode-shared-fake-ha.md`.

## Business-Critical Paths

Changes here carry the highest test and review burden:

- **Anything that sends HA actions** (service gateway, domain actions): these change real devices in a real house, including locks, covers, and climate. A bug can unlock a door or turn off heating.
- **Auth and token handling** (`src/ha.ts`, `src/storageKeys.ts`, `e2e/fixtures.ts`): OAuth code handling, token storage, the long-lived token path. Tokens must never reach the bundle, logs, or git.
- **Connection and reconnect**: the kiosk runs for weeks; a stuck or silent disconnect means the wall shows stale state.
- **Entity config** (`home.json`): wrong IDs show the wrong room or control the wrong device.
- **Deployment** (`Dockerfile`, `deploy/`, workflow): a bad deploy takes the dashboard down; Compose mistakes on the host can take HA down.

## Architecture Decision Records

Before changing anything in the business-critical list, check `.farseer/adr/` for a decision covering that area.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
