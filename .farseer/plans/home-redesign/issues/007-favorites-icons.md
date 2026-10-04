# Task 007: Favorites Tile Icons

**Status**: pending
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

- [ ] `it shows a lightbulb icon on a light tile`
- [ ] `it shows the matching icon for switch, fan, scene, and script tiles`
- [ ] `it shows a fallback icon on a display-only tile`
- [ ] `it highlights the icon of a tile whose entity is on`

## Acceptance Criteria

- All requirements have passing tests
- Existing favorites and controls specs still pass unchanged
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
