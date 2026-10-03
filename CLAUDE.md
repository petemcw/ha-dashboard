# Home Assistant Dashboard

A custom web dashboard for my Home Assistant. It's a standalone React app, not a Lovelace dashboard. It talks to HA over the WebSocket API and runs as a container in my existing Docker Compose stack.

## Status

Scaffolded: a Vite + React + TS app that only connects to HA and shows the entity count, plus the deploy pipeline (`Dockerfile`, `deploy/`, `.github/workflows/image.yml`). No real UI yet.

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

- Image: multi-stage Dockerfile (Node build, then `nginx:alpine`). The HA URL comes from a `config.json` written at container start from env, not baked into the bundle. `index.html` is `no-cache`; hashed assets are `immutable`.
- CI: GitHub Actions builds `linux/amd64` on push to `master` and pushes `ghcr.io/petemcw/ha-dashboard`. The repo is public, so the host pulls without credentials.
- Exposure: a Tailscale sidecar container gives the dashboard its own tailnet name (`https://maplefrontier.alpine-ling.ts.net`). The nginx container shares its network namespace, so nothing is published on the host. It's a different origin from HA and is listed in HA's CORS allowed origins.
- Deploy: `docker compose pull dashboard && docker compose up -d dashboard` in `/home/prm/iot`. `deploy/compose.yml` has the services and one-time setup; `deploy/serve.json` is the sidecar's serve config.
- Dev: `npm run dev` reads `VITE_HA_URL` from `.envrc` instead of `config.json`. The dev origin (`http://localhost:5173`) is also in CORS allowed origins.
- Goal: eventually Funnel only the dashboard and make HA tailnet-only.

## Testing

- Full strategy, mock boundaries, and naming: `.farseer/testing.md`. Before committing: `npm run format:check && npm run lint && npm test && npm run build`.
- `npm test` runs Vitest (unit and component tests, jsdom). `npm run test:coverage` enforces 80% on `src/domains/` and `src/infrastructure/`.
- `npm run test:e2e` runs Playwright (headless Chromium) against the Vite dev server and the **live** HA instance, at `phone` (393×852) and `tablet` (1180×820) viewports. It starts the dev server itself, or reuses one already on :5173.
- Auth: `e2e/fixtures.ts` puts `HA_TOKEN` (from `.env.local` via direnv) into the browser's localStorage, so the app uses its long-lived token path (`LONG_LIVED_TOKEN_KEY` in `src/storageKeys.ts`) instead of the OAuth redirect. The token never goes into the bundle or into source.
- Screenshots go to `e2e/screenshots/` (gitignored). Use them to check layouts visually after UI changes.
- Tests run against the real house: reading state is fine, but tests must not call services that change devices. Use a demo/fixture mode for exercising controls (not built yet).
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

- Which wall tablet/screen hardware, and in which browser/kiosk app. (It will need Tailscale to reach the dashboard.)

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
