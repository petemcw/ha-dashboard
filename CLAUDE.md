# Home Assistant Dashboard

A custom web dashboard for my Home Assistant. It's a standalone React app, not a Lovelace dashboard. It talks to HA over the WebSocket API and runs as a container in my existing Docker Compose stack.

## Status

Greenfield. Nothing is scaffolded yet. The intended stack and constraints are below.

## Environment

| Thing           | Where                                                                   | Notes                                                                     |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Home Assistant  | `https://homeassistant.alpine-ling.ts.net` (Tailscale; LAN 10.10.20.98:8123) | 2026.9.4. Container install (Docker). No Supervisor, no add-ons. HACS is installed. |
| UniFi console   | `https://10.10.20.1`                                                    | Runs UniFi Network (no Protect or Access). Self-signed cert.              |
| Dev machine     | macOS, Node 20 (nvm), `uv`/`uvx`, Docker, direnv, 1Password CLI (`op`)  |                                                                           |

The HA config lives in a Docker volume on the HA host, so the add-on approaches (Samba, SSH, Git pull) don't apply. Change HA through the API or MCP.

## Stack (planned)

- React + Vite + TypeScript.
- [`home-assistant-js-websocket`](https://github.com/home-assistant/home-assistant-js-websocket) for the connection, auth, and `subscribeEntities` live state. Don't poll REST for state.
- Mobile-first, because phones are the main target. A wall tablet/screen comes later, so keep layouts responsive and support a kiosk-style view: no hover-only UI, large touch targets, works on long-lived sessions, and reconnects after network drops or HA restarts.
- Ships as a static build served by a small container (e.g. nginx) added to the existing Compose stack.

## Auth and secrets

- **Never** commit tokens or put a long-lived token in the client bundle. Phones should use HA's OAuth login flow (`getAuth({ hassUrl })` in home-assistant-js-websocket). A kiosk tablet can use a token entered at runtime and stored on the device.
- If the app is served from a different origin than HA, HA needs `http: cors_allowed_origins` listing the app's origin, or the token exchange fails. That change goes in HA's `configuration.yaml`, so confirm with me before making it.
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

- Where the Docker Compose stack lives (host/path), and how deploys happen (build on host vs. pushing an image).
- The dashboard's hostname/port, and whether phones need it away from home (UniFi VPN/Teleport, Nabu Casa, or a reverse proxy).
- Which wall tablet/screen hardware, and in which browser/kiosk app.
