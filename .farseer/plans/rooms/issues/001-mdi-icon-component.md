# Task 001: MDI Icon Component and Runtime Icon Map

**Status**: completed
**Issue**: #45
**Depends on**: none
**Retry count**: 0

## Description

Add `@mdi/js` and a small `Icon` component that renders an MDI path as an inline SVG, plus `iconForHa`, which turns a runtime `mdi:<name>` string from HA (area or entity icon) into a path through a curated map, with a caller-supplied fallback. This is the expand step of the Lucide → MDI swap: nothing is migrated here, so every existing test stays green. It also widens `SectionCard`'s `icon` prop to accept a path or a Lucide component, so the two migration batches (002, 003) can run in parallel.

## Context

- Related files: new `src/features/shared/icons/Icon.tsx`, `src/features/shared/icons/haIcons.ts` (the curated map), `src/features/shared/icons/domainIcons.ts` (default icon per HA domain and per area fallback), `package.json`, `src/features/home/SectionCard.tsx` (+ `SectionCard.test.tsx`).
- `SectionCard` today types `icon?: LucideIcon` and renders `<Icon className="card__icon" size={14} aria-hidden="true" />`. Widen it to `icon?: string | LucideIcon`: a string renders through `Icon` with the same class and size, a component renders as today. 002 and 003 move callers to paths in parallel; 004 narrows it to `string`. Without this, whichever batch lands first breaks `tsc -b` for the other's callers.
- `Icon` renders one `<svg>` with one `<path d={path}>`, so tests identify an icon by comparing the path's `d` with the imported `mdi*` constant (MDI paths carry no class name like Lucide's `lucide-sun`).
- Patterns to follow: Lucide icons today are `aria-hidden` decoratives sized by CSS (`SectionCard.tsx`, `attentionIcons.ts`). `Icon` takes `path`, optional `size` (default `1em` so CSS controls it), `className`, and is `aria-hidden` unless given a `title`. `fill="currentColor"`, `viewBox="0 0 24 24"`.
- Import icons by name only (`import { mdiGarage } from '@mdi/js'`) so Vite tree-shakes. Never `import * as mdi` or a dynamic import of the module.
- The curated map covers about 150 home-automation names: rooms (sofa, bed, bed-king, bathtub, shower-head, desk, countertop, table-furniture, coat-rack, garage, garage-variant, stairs, stairs-box, washing-machine, water-boiler, weight-lifter, television, glass-cocktail, school, grill, coach-lamp, wall-sconce-round, nature-people, home, …), devices (lightbulb variants, lamp, ceiling-light, led-strip, fan, power-plug, power-socket, speaker, television, cast, thermostat, lock, door, window-shutter, blinds, garage-open, radiator, air-conditioner, robot-vacuum, …), and states. Keys are the bare names (`'sofa'`), the resolver strips the `mdi:` prefix. Anything else (including `hass:` or a non-`mdi:` prefix) returns the fallback.
- `domainIcon(entityId)` gives the default per HA domain (light, switch, fan, input_boolean, scene, script, media_player, cover, climate, lock, sensor, binary_sensor) with a neutral fallback, replacing `favoriteIcon`'s table in 003.

## Requirements (Test Descriptions)

- [x] `it renders an MDI path as an svg that is hidden from assistive tech`
- [x] `it labels the svg when a title is given`
- [x] `it resolves a known mdi: name from HA to its path`
- [x] `it returns the fallback for an mdi: name that is not in the curated map`
- [x] `it returns the fallback for an empty, undefined, or non-mdi icon string`
- [x] `it picks a default icon by HA domain with a neutral icon for unknown domains`
- [x] `it renders a section card icon given as an MDI path or as a Lucide component`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Added `@mdi/js`, `Icon`, `iconForHa` (curated map, 198 names, generated from a verified name list), `domainIcon`, and widened `SectionCard`'s `icon` to `string | LucideIcon`.
- Tests need Node 24 (`nvm use`); the default shell node failed to start Vitest.
- Icon tests were written alongside the component and passed on first run.
