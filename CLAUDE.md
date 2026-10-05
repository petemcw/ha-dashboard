# Home Assistant Dashboard

A custom web dashboard for my Home Assistant. It's a standalone React app, not a Lovelace dashboard. It talks to HA over the WebSocket API and runs as a container in my existing Docker Compose stack.

## Status

v1 home screen built: a read-mostly Home view laid out as a responsive card grid (needs-attention rows with icons and snoozes, suggestions, presence, favorites with icons and an editor, crypto, plus display-only Today (weather, forecast, sunset), Systems (gateway, access points, backup, updates, CPU bars), and Media (configured players, now playing) cards) over `subscribeEntities`, with a slim sticky header bar (presence, clock, Settings, and a one-tap light/dark toggle), an app shell, connection banner, settings sheet, and kiosk token entry. Plus the deploy pipeline (`Dockerfile`, `deploy/`, `.github/workflows/image.yml`). Mocked e2e specs use the HA WebSocket mock; `@live` specs are read-only (the guard blocks `call_service`, `frontend/set_*`, and registry writes). The Today, Systems, and Media cards come from optional `weather`, `systems`, and `media` sections of `home.json` (see `home.example.json`); a card with no section is hidden.

Controls are live through the service gateway (`src/infrastructure/serviceGateway/`), the only code that calls `callService`. It refuses to send unless the connection is `connected` and never queues.

- Live: light, switch, and fan favorites (toggle); scene favorites (activate); script favorites (run, disabled while running); suggestion buttons (activate a scene, with an optional transition); left-on attention actions (rechecked at send time; `toggle` actions use a two-tap confirm); filter "Mark replaced" (two-tap confirm, runs the reset script).
- Rooms (Home column 1: a room selector above Needs attention, the room card after Suggestions): a room is an HA area with something to control. The selector opens a sheet (Auto, then rooms by floor, then "Other" for areas without a floor); the pick stays on the device. Auto shows the `rooms.awayRoom` area when the signed-in person is away (never on a kiosk) and nothing otherwise. The room card has the area's temperature and humidity, light tiles (tap, drag for brightness, a ⋯ sheet for color temperature and color), switch, fan, and input_boolean toggles, scenes, scripts, and media players (transport and volume on active ones, chips with power for idle or off). Rooms and registries come from `config/*_registry/list*` over the same socket. A top-level `confirm` list in `home.json` makes an entity two-tap everywhere, favorites included. Icons are MDI (`@mdi/js`); Lucide is gone.
- Display-only: cover, climate, and lock tiles, and the Home Media card.
- Failures show inline on the control and clear on the next tap, after 60 s, or when HA reports the entity changed.
- Demo mode: `?demo` runs the real app and gateway over a shared in-browser fake HA (`src/infrastructure/fakeHa/`, `src/app/demo/`) on placeholder data (including weather and forecast, systems, media players, and rooms with floors and areas). Per page load, never stored, no real HA contact. See `.farseer/adr/0001-demo-mode-shared-fake-ha.md`.

## Environment

| Thing           | Where                                                                             | Notes                                                                     |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Home Assistant  | `https://homeassistant.alpine-ling.ts.net` (Tailscale; LAN 10.10.20.98:8123)      | 2026.9.4. Container install (Docker). No Supervisor, no add-ons. HACS is installed. |
| UniFi console   | `https://10.10.20.1`                                                              | Runs UniFi Network (no Protect or Access). Self-signed cert.              |
| Compose host    | `10.10.20.98` (x86_64), SSH as `prm`. Stack at `/home/prm/iot/docker-compose.yml` | Local git repo, no remote. All services pull registry images. `tailscaled` runs on the host (`tailscale serve` needs sudo). No reverse proxy. |
| Dev machine     | macOS, Node 24 (nvm, `.nvmrc`), `uv`/`uvx`, Docker, direnv, 1Password CLI (`op`)  |                                                                           |

The HA config lives in a Docker volume on the HA host, so the add-on approaches (Samba, SSH, Git pull) don't apply. Change HA through the API or MCP.

## Stack

- React + Vite + TypeScript.
- [`home-assistant-js-websocket`](https://github.com/home-assistant/home-assistant-js-websocket) for the connection, auth, and `subscribeEntities` live state. Don't poll REST for state.
- Mobile-first, because phones are the main target. A wall tablet/screen comes later, so keep layouts responsive and support a kiosk-style view: no hover-only UI, large touch targets, works on long-lived sessions, and reconnects after network drops or HA restarts.
- Ships as a static build served by a small container (e.g. nginx) added to the existing Compose stack.

## Deployment (decided)

- Image: multi-stage Dockerfile (Node build, then `nginx:alpine`). The HA URL comes from a `config.json` written at container start from env, not baked into the bundle. The house's entity IDs and thresholds live in a runtime `/home.json`, never in the repo: nginx serves it from `/config/home.json` on a mounted host directory (`config/ha-dashboard/`), so edits need a reload, not a rebuild. `home.example.json` is the generic template. People come from the `person.*` entities in HA unless `home.json` has a `people` list. `index.html` is `no-cache`; hashed assets are `immutable`.
- CI: GitHub Actions builds `linux/amd64` on push to `master` and pushes `ghcr.io/petemcw/ha-dashboard`. The repo is public, so the host pulls without credentials.
- Exposure: a Tailscale sidecar container gives the dashboard its own tailnet name (`https://maplefrontier.alpine-ling.ts.net`). The nginx container shares its network namespace, so nothing is published on the host. It's a different origin from HA and is listed in HA's CORS allowed origins.
- Deploy: `docker compose pull ha-dashboard && docker compose up -d ha-dashboard` in `/home/prm/iot`. `deploy/compose.yml` has the services and one-time setup; `deploy/serve.json` is the sidecar's serve config.
- Dev: `npm run dev` reads `VITE_HA_URL` from `.envrc` instead of `config.json`, and Vite serves the gitignored `public/home.json` (copy `home.example.json` and edit it) as `/home.json`. The dev origin (`http://localhost:5173`) is also in CORS allowed origins.
- Goal: eventually Funnel only the dashboard and make HA tailnet-only.

## Testing

- Full strategy, mock boundaries, and naming: `.farseer/testing.md`. Before committing: `npm run format:check && npm run lint && npm test && npm run build`.
- `npm test` runs Vitest (unit and component tests, jsdom). `npm run test:coverage` enforces 80% on `src/domains/` and `src/infrastructure/`.
- `npm run test:e2e` runs Playwright (headless Chromium) against the Vite dev server and the **live** HA instance, at `phone` (393×852) and `tablet` (1180×820) viewports. It starts its own dev server on :5174 with `VITE_HA_URL` blanked, so mock specs never reach the real HA; each fixture serves `/config.json` (the mock URL, or `HA_URL` for `@live`). Mock specs also serve `/home.json` from the shared placeholder config `src/config/testHomeConfig.ts` (override per test with the `homeConfig` / `homeConfigMissing` mock options); `@live` specs use the real `public/home.json` and fail fast if it's missing.
- Auth: `e2e/fixtures.ts` puts `HA_TOKEN` (from `.env.local` via direnv) into the browser's localStorage, so the app uses its long-lived token path (`LONG_LIVED_TOKEN_KEY` in `src/infrastructure/storageKeys.ts`) instead of the OAuth redirect. The token never goes into the bundle or into source.
- Screenshots go to `e2e/screenshots/` (gitignored). Use them to check layouts visually after UI changes.
- Tests run against the real house: reading state is fine, but tests must not call services that change devices. Mocked specs and `?demo` exercise `call_service` against the fake HA; `@live` specs still never call services.
- Simulate network drops with `page.routeWebSocket` (see the reconnect test in `e2e/smoke.spec.ts`).
- Tests against the real instance are tagged `@live`; filter with `--grep @live` / `--grep-invert @live`.

## Auth and secrets

- **Never** commit tokens or put a long-lived token in the client bundle. Phones should use HA's OAuth login flow (`getAuth({ hassUrl })` in home-assistant-js-websocket). A kiosk tablet can use a token entered at runtime and stored on the device.
- CORS (checked live): HA's `/auth/*` endpoints, including the OAuth token exchange, allow any origin, and the WebSocket isn't subject to CORS. HA's **CORS allowed origins** list only gates REST `/api/*` calls, so the app's origin must be listed before it makes any REST call. Since HA 2026.8 the HTTP settings live in the UI (Settings → System → Network → HTTP server), not in a `configuration.yaml` `http:` block, which is deprecated and ignored after migration. Saving them restarts HA, so confirm with me before changing them.
- Tooling env comes from direnv. `.envrc` (committed) holds non-secret config and loads `.env.local` (gitignored; template in `.env.example`), which holds `HA_TOKEN`, `HA_MCP_URL`, `UNIFI_NETWORK_USERNAME`, and `UNIFI_NETWORK_PASSWORD`. Claude Code only sees them when it's launched from a shell in this directory. Putting them in `settings.json` `env` does **not** work for `${VAR}` expansion in `.mcp.json`. `HA_URL` must not end in `/`, or `/api/...` turns into `//api/...` and returns 404. The local `config/` folder is a gitignored snapshot of the HA config; it can be out of date, so prefer live data from MCP.

## Claude tooling in this repo

MCP servers (`.mcp.json` and plugins):

- **`ha-mcp`**: the main HA tool. It runs inside HA as the HACS "HA-MCP Custom Component", and `HA_MCP_URL` points at its in-process server on the LAN (`10.10.20.98:9584/<secret path>`). The secret path is the credential, so never echo it. Use it for entity discovery (`ha_search`, `ha_get_overview`, `ha_get_state`), history, services, areas, and helpers. Prefer it when you need to know which entities exist before building UI for them.
- **`ha-assist`**: HA's built-in MCP Server integration (`/api/mcp`). It only sees entities exposed to Assist. Treat it as a fallback or a spot check, not the source of truth. It's configured with the Assist API only; don't also expose ha-mcp's tools through it.
- **`unifi-network`** (plugin `unifi-network@unifi-plugins`): UniFi Network data, such as clients, devices, and WAN/AP health. It runs in `confirm` mode with create/update/delete disabled. Keep it read-only unless I explicitly opt in.

Skills:

- `home-assistant-skills` plugin: HA best practices (helpers vs templates, automations, entity/device IDs). Load it before suggesting any HA-side config such as helpers, template sensors, or automation that support the dashboard.
- `unifi-network` plugin skills: `network-health-check`, `firewall-auditor`, and others.

## Rules of engagement

- Reading from HA or UniFi is always fine. **Ask before** any write to HA (service calls that change real devices, creating/editing helpers or automation, restarts, `configuration.yaml`) or to UniFi. This is my real house.
- Reference entities by `entity_id` from live data. Don't invent IDs. When an entity is missing, say so instead of guessing.
- Before giving an exact answer about an HA API (WebSocket message types, service schemas, `home-assistant-js-websocket` exports), check the current docs or the live instance, because they change between releases.

## Open questions

- None open. A wall tablet/screen is future work with no hardware planned, so don't plan around a specific device or kiosk app; just keep layouts kiosk-friendly (see Stack). When it happens, it will need Tailscale to reach the dashboard.

## Agent Skills

Project configuration files are in `.farseer/`:

- `architecture.md` - Technical patterns and structure
- `code-standards.md` - Coding conventions
- `testing.md` - Test configuration and commands

### Domain Context

Home Assistant vocabulary (entity, HA domain, HA action vs. domain action, view model, service gateway, unavailable vs. missing) and the business-critical paths: anything that sends HA actions, auth/tokens, reconnect, entity config, deployment. See `.farseer/domain.md`.

### Issue Tracker

GitHub Issues on the public `petemcw/ha-dashboard` repo via `gh`; keep secrets and house-revealing details out of issues. See `.farseer/issue-tracker.md`.

### Triage Labels

Default Farseer roles, label string equal to the role name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, plus `bug` and `enhancement`). See `.farseer/issue-labels.md`.
