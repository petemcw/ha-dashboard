# Task 014: Home screen composition, layouts, and live smoke

**Status**: completed
**Depends on**: 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 015
**Retry count**: 0

## Description

Put the sections in their final order and layout for phone and tablet, update the `@live` smoke test to check the real home screen through the read-only guard from task 003, and refresh the docs so they describe what was built.

## Context

- Related files: `src/features/home/HomeScreen.tsx`, `src/app/AppShell.tsx`, theme tokens, `e2e/fixtures.ts` (`liveTest` and its guard from 003), `e2e/smoke.spec.ts`, `e2e/home.spec.ts`, `CLAUDE.md` (Status section), `docs/feature-decisions.md`
- Order: attention (urgent, then chores, then "N snoozed"), suggestions, presence, favorites, crypto.
- Phone (393 px): one column. Tablet (1180 px): two columns; attention and suggestions span the top, then presence + crypto beside favorites. Use CSS grid with a width breakpoint, not JS. No horizontal page scroll at either size.
- The section-order and layout specs run against the mock (`e2e/home.spec.ts`) and seed the Apple TV as `playing`, because the suggestions strip (013) is hidden when there are no suggestions.
- Live read-only guard: already in `liveTest` from task 003 (blocks `call_service` and `frontend/set_*` before they reach HA). Use it; don't register another `routeWebSocket` in live specs.
- `@live` smoke: against the real instance, assert the attention (which may show its "Nothing needs attention" empty state), presence, favorites, and crypto regions render. Check suggestions only if the strip is present, since it depends on whether the TV is playing. Screenshot to `e2e/screenshots/home-<project>.png`. Assert structure, not house-specific values.
- Docs: update `CLAUDE.md` "Status" to describe v1; mark in `docs/feature-decisions.md` what shipped in v1.

## Requirements (Test Descriptions)

- [x] `it shows the sections in order: attention, suggestions, presence, favorites, crypto`
- [x] `it lays the home screen out in one column at phone width without horizontal scroll`
- [x] `it lays the home screen out in two columns at tablet width`
- [x] `it renders the home sections against the real Home Assistant instance`

## Acceptance Criteria

- All requirements have passing tests; the full suite passes: `npm run format:check && npm run lint && npm test && npm run build`, `npm run test:e2e`
- The `@live` run passes whether or not the family room Apple TV is playing
- Screenshots at both viewports reviewed for layout problems
- No `call_service` or `callService` anywhere in `src/` (grep)
- Code follows code standards

## Implementation Notes

- HomeScreen wraps each region in a `home__*` div inside `.home__grid`; CSS grid, one column by default, two columns (1fr / 2fr, named areas) from 900px. Empty wrappers are hidden (suggestions strip).
- Removed the `html, body { overflow-x: hidden }` hack. Real fix: `overflow-wrap: anywhere` on `.home` and `min-width: 0` on grid children. The phone spec seeds a long unbreakable chore name, a snoozed long-name chore, and missing-entity chores, expands the snoozed list, and asserts scrollWidth <= viewport width. favorites-editor spec passes.
- Mock layout screenshots: `e2e/screenshots/home-layout-<project>.png`; live smoke writes `home-<project>.png`.
- CLAUDE.md Status and docs/feature-decisions.md updated.
