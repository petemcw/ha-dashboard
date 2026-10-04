# Task 009: `weather`, `systems`, and `media` Sections in home.json

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Add three optional sections to the runtime `home.json` so the new cards know which entities to read. A missing section means the card doesn't render. A present but invalid section fails parsing with a path-specific message, like every other section.

## Context

- Related files: `src/config/homeConfig.ts` (types, `optional()`, `section()`, `list()`, `string()`), `src/config/homeConfig.test.ts` (parses `home.example.json` via `?raw`), `home.example.json`, `src/config/testHomeConfig.ts`.
- Shapes (placeholder IDs only; the repo is public):

```ts
type WeatherConfig = { entity_id: string; sun?: string } // sun defaults to 'sun.sun'
type SystemsConfig = {
  status: { entity_id: string; upState: string; label: string } // e.g. gateway state 'connected', "Gateway"
  uptime?: { entity_id: string; label: string } // timestamp sensor (boot time); label under the value, e.g. "Gateway"
  accessPoints?: { entity_ids: string[]; upState: string } // state sensors; "online" when state equals this upState
  backup?: string // last successful backup timestamp sensor
  cpu?: { label: string; entity_id: string }[] // percent sensors
}
type MediaConfig = { players: string[] }
```

- The chip label is built from `status.label`: "{label} online" / "{label} offline". The owner can point `status` at a Ping or WAN sensor later without a code change.
- `uptime` and `accessPoints` don't borrow anything from `status`. If they did, pointing `status` at a Ping sensor (up state `on`) would make every access point (`connected`) read offline and label the gateway's uptime "Internet", which breaks the "no code change" promise above.
- Fix `strings()` in `homeConfig.ts` while you're here: it fails with `` `${key}[${i}]` `` and leaves out `path`, so a bad `systems.accessPoints.entity_ids[1]` would report "entity_ids[1] must be a string". Prefix the path (keep `people[0]` reading as it does today, since its path is `''`).
- Add all three sections to `home.example.json` (the template, generic IDs like `weather.forecast_home`, `sensor.gateway_state`, `sensor.office_ap_state`, `media_player.living_room_speaker`) and to `testHomeConfig.ts`, so Vitest, Playwright, and demo mode share one placeholder house.
- Only config here. The cards come in 010–013.

## Requirements (Test Descriptions)

- [x] `it parses a home config with none of the weather, systems, or media sections`
- [x] `it parses a weather section and defaults the sun entity to sun.sun`
- [x] `it rejects a weather section without an entity_id`
- [x] `it parses a systems section with its status entity, up state, and label`
- [x] `it rejects a systems cpu entry without a label`
- [x] `it parses access points with their own up state and uptime with its own label`
- [x] `it names the full path of a bad entry in a nested list of entity ids`
- [x] `it parses a media section with its list of players`
- [x] `it parses the example home config including the new sections`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Optional `weather`, `systems`, `media` sections parse to `undefined` when absent; `weather.sun` defaults to `sun.sun`.
- `systems.uptime` and `systems.accessPoints` carry their own `label` / `upState`, independent of `status`.
- `strings()` now prefixes the path (`systems.accessPoints.entity_ids[1] must be a string`); `people[0]` unchanged.
- `home.example.json` and `src/config/testHomeConfig.ts` share the three sections with placeholder IDs.
- Worker wrote the nine tests in one batch rather than strict red/green per test (reported by the worker). Orchestrator verified all 24 config tests pass on Node 24.
