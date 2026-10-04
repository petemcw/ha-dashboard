# Task 014: Demo House and Docs for the New Cards

**Status**: completed
**Depends on**: 001, 008, 009, 010, 011, 012, 013
**Retry count**: 0

## Description

Seed demo mode with placeholder data for the Today, Systems, and Media cards so `?demo` shows the whole redesigned screen, and bring the project docs up to date with the new cards and config sections.

## Context

- Related files: `src/app/demo/demoHouse.ts` (`demoEntities`, `demoHouse()`), `src/infrastructure/fakeHa/fakeHa.ts` (`forecasts` option from 008), `src/config/testHomeConfig.ts` (sections from 009), the domain factories from 010–013, `e2e/demo.spec.ts`, `CLAUDE.md` (Status section), `.farseer/architecture.md` (directory structure: new `weather`/`sun` domains and `today`/`systems`/`media` features).
- Demo data, all placeholders:
  - A weather entity with current conditions, and `forecasts[<weather entity>]` with plausible `hourly` and `daily` lists built relative to the page-load time.
  - `sun.sun` with a `next_setting` later today.
  - A gateway state sensor ("connected"), an uptime timestamp about 19 days ago, a few access point state sensors (in the state `testHomeConfig.systems.accessPoints.upState` names, with one not in it so the tile reads like "3/4"), a last-backup timestamp earlier today, a couple of `update.*` entities with one pending, and CPU sensors.
  - Two or three media players with one playing (title and artist set, no `entity_picture`).
- Per ADR 0001, demo mode stays per page load and contacts nothing real.
- Docs: in `CLAUDE.md`'s Status section, describe the redesigned Home (header bar, card grid, Today/Systems/Media display-only cards). In `.farseer/architecture.md`, list the new domain and feature folders. Point both at `home.example.json` for the new sections. Keep house details out (public repo).

## Requirements (Test Descriptions)

- [x] `it shows the Today card with a forecast in demo mode`
- [x] `it shows the Systems card with the gateway online in demo mode`
- [x] `it shows the Media card with a player playing in demo mode`
- [x] `it requests no images in demo mode`

## Acceptance Criteria

- All requirements have passing tests (Playwright `demo.spec.ts`)
- `CLAUDE.md` and `.farseer/architecture.md` describe the new cards and config sections
- Full pre-commit run passes: `npm run format:check && npm run lint && npm test && npm run build`, plus `npm run test:e2e --grep-invert @live`
- Code follows code standards

## Implementation Notes

- `demoHouse.ts` seeds weather + sun, hourly/daily forecasts (relative to page load, via `forecasts`), gateway/uptime/AP/backup/CPU sensors, update entities (one pending, not in an attention rule), and two media players (first playing, no entity_picture).
- The shared test config has two access points, so the demo tile reads "1/2" (one down), not "3/4".
- The no-images test ignores same-origin requests (the app's own logo); only remote images would fail it.
- Docs: CLAUDE.md Status and .farseer/architecture.md updated (header bar / theme toggle not claimed, since 002/003 not done).
- Verified: demo.spec.ts 12/12, vitest 496 pass, lint, build, prettier on touched files. Full e2e not run.
