# Task 007: Favorites Tile Icons

**Status**: completed
**Depends on**: 001
**Retry count**: 0

## Description

Add an icon to each favorites tile based on the entity's HA domain, and restyle the tiles to the mock-up: a small round icon at the top, then the name and state at the bottom. When a tile's entity is on, the tile and its icon are highlighted in the leaf color.

## Context

- Related files: `src/features/home/favorites/Tile.tsx`, `FavoriteTile.tsx`, `LightTile.tsx`, `OnOffTile.tsx`, `SceneTile.tsx`, `ScriptTile.tsx`, `StateTile.tsx`, `FavoritesSection.tsx`, `src/index.css` (`.favorites`, `.favorite-tile`), `e2e/favorites.spec.ts`, `e2e/controls.spec.ts`.
- Mapping (one pure function, tested): light → lightbulb, switch → power plug, fan → fan, scene → sparkles, script → play/scroll, anything else (display-only `StateTile`, e.g. media_player, cover, climate, lock) → a generic icon for the domain where `lucide-react` has an obvious one, otherwise a neutral circle-dot.
- The icon is decorative (`aria-hidden`). The tile's accessible name, description and `aria-pressed` stay as they are.
- The "on" highlight follows the tile's existing `data-active` attribute. Don't add new state.
- Grid: tiles auto-fill at a minimum of about 96 px with a 10 px gap and a minimum height of 74 px, three across in a phone-width card.

## Requirements (Test Descriptions)

- [x] `it shows a lightbulb icon on a light tile`
- [x] `it shows the matching icon for switch, fan, scene, and script tiles`
- [x] `it shows a fallback icon on a display-only tile`
- [x] `it highlights the icon of a tile whose entity is on`

## Acceptance Criteria

- All requirements have passing tests
- Existing favorites and controls specs still pass unchanged
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- New `favorites/favoriteIcon.ts` maps HA domain to a lucide icon (light, switch, fan, scene, script; media_player, cover, climate, lock; fallback CircleDot).
- `FavoriteTile` passes `icon` to every tile; `Tile` renders it as `svg.favorite-icon` (aria-hidden) above name/state. `icon` is part of `TileControl`.
- CSS: `.favorites` min 96px / gap 10px, tile min-height 74px; own block at the end of `index.css` for `.favorite-icon` (round, leaf-filled when `data-active`).
- Tests added to `FavoritesSection.test.tsx` (class-based icon checks). Favorites/controls e2e pass unchanged.
- Unrelated tsc error from worker 004 (`attentionKinds.test.ts` `kind`) not touched.
