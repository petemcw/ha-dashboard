# Task 009: Presence row

**Status**: completed
**Depends on**: 001, 003
**Retry count**: 0

## Description

Show everyone in the family as a compact row of avatars with a home/away marker and, when away in a named zone, the zone name. Photos come from HA; initials stand in when there's no photo or it fails to load.

## Context

- Related files: `src/config/home.ts` (`people`), `src/features/home/HomeScreen.tsx` (presence region), `src/infrastructure/ha/runtimeConfig.ts` (HA URL), `src/domains/factories.ts`
- New: `src/domains/person/` (`types.ts`, `viewModel.ts`, `factories.ts`, `components/PersonAvatar.tsx`), `src/features/home/presence/PresenceRow.tsx`.
- Person states (checked live): `home`, `not_home`, `unknown` (a person with no trackers, e.g. `person.casey_rivera`), or a zone's name (e.g. `Work`). View model: `{ name, initials, presence: 'home' | 'away' | 'zone' | 'unknown' | 'unavailable' | 'missing', zoneName?, pictureUrl? }`.
- `entity_picture` is a relative path (`/api/image/serve/<id>/512x512`) and HA is a different origin, so resolve it against the HA URL from runtime config. These URLs load without auth (checked live). The domain view model takes the base URL as an argument (domains don't import config).
- Initials from `friendly_name` ("Alex Rivera" → "AR"). Fall back to initials on `<img>` `error`.
- Accessible name per avatar: "Alex Rivera, home" / "Taylor Rivera, away" / "…, at Work" / "…, location unknown". Presence must not rely on color alone (icon or text too).
- The row scrolls horizontally on narrow screens if needed; avatars ≥ 44 px.
- `src/domains/person/factories.ts` follows the factory import rule in task 003 (explicit `.ts` relative imports, `import type` from the library, no browser globals). The mock fixture routes HA-origin image requests, so mock specs can exercise the initials fallback without reaching the real house.

## Requirements (Test Descriptions)

- [x] `it shows a person at home as home`
- [x] `it shows a person who is not_home as away`
- [x] `it shows the zone name when a person is in a named zone`
- [x] `it shows a person with an unknown state as location unknown`
- [x] `it resolves the person's picture against the Home Assistant URL`
- [x] `it shows initials when a person has no picture or the picture fails to load`
- [x] `it shows a configured person missing from Home Assistant as missing`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec in `e2e/presence.spec.ts` with mixed states)
- Coverage ≥ 80% for `src/domains/person`
- Code follows code standards

## Implementation Notes

- New: `src/domains/person/{types,viewModel,factories}.ts`, `components/PersonAvatar.tsx` (list item with accessible name, text marker, initials fallback on img error), `src/features/home/presence/PresenceRow.tsx`, `e2e/presence.spec.ts`.
- Additive: `src/infrastructure/ha/useHaUrl.ts` (hook over `loadConfig`) so the row can resolve pictures; the row renders empty until the URL loads.
- Domain tests were written together with the view model (they passed on first run); an extra `unavailable` presence case is covered.
- Run e2e with `VITE_HA_URL`/`HA_URL` unset (env here had it set, which bypasses the mock's /config.json) and a private `--output` dir when other workers run Playwright concurrently (shared test-results collides). Mock specs must request the `mockHa` fixture.
- Missing person name is derived from the id ("casey rivera").
