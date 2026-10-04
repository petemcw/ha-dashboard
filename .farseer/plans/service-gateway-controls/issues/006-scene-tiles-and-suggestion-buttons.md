# Task 006: Scene Tiles and Suggestion Buttons

**Status**: pending
**Issue**: #23
**Depends on**: 001, 002, 004, 005
**Retry count**: 0

## Description

Add the scene HA domain (factory, view model, `activateScene` domain action) and use it in two places: a scene favorite tile that activates the scene on a tap, and the Suggestions strip, whose buttons stop being disabled and run their configured scene with its optional transition.

## Context

- Related files:
  - New: `src/domains/scene/{factories,viewModel,actions}.ts` (+ tests), `src/features/home/favorites/SceneTile.tsx`, `e2e/scene-controls.spec.ts` (scene tile and suggestion taps; a separate file so it doesn't collide with `e2e/controls.spec.ts`)
  - Modify: `src/features/home/favorites/FavoriteTile.tsx` (`case 'scene'`), `src/features/home/suggestions/SuggestionsStrip.tsx` (remove the disabled state and the "Available when controls are enabled" hint; wire `useAction`, `useControlsEnabled`, `ActionError`), `suggestionRules.ts` (carry `transition` on the `Suggestion`), `SuggestionsStrip.test.tsx`, `e2e/suggestions.spec.ts`
  - **Existing assertions this task must rewrite (review I12):** `e2e/suggestions.spec.ts:12-13` (expects the mood button disabled with the "Available when controls are enabled" description) and `SuggestionsStrip.test.tsx:42-47` (same). Both now expect an enabled button while connected.
  - Reference: `src/config/homeConfig.ts` (`SuggestionsConfig`: `playing.transition` is optional, `paused` has none)
- `activateScene(gateway, sceneId, { transition? })` → `callService('scene', 'turn_on', transition === undefined ? undefined : { transition }, { entity_id: sceneId })`.
- A scene tile and a suggestion button are plain buttons (no `aria-pressed`). A scene's state is the time it was last activated; the tile doesn't need to show it.
- The suggestion strip stays memoized and still hides when nothing is suggested. Hooks can't run in the `items.map` loop: each suggestion is its own small component with its own `useAction`.
- Use task 004's contract: `SceneTile` uses `Tile`'s run mode; failures render through `ActionError`.
- E2E specs must seed the scene entities (`scene.living_room_movie`, `scene.living_room_bright` from `testHomeConfig`, plus the favorite scene) in `haOptions.entities`: the fake HA answers `not_found` for an entity it doesn't have.

## Requirements (Test Descriptions)

- [ ] `it sends scene.turn_on with the transition when the playing suggestion is tapped`
- [ ] `it sends scene.turn_on without a transition when the suggestion has none`
- [ ] `it sends scene.turn_on when a scene favorite tile is tapped`
- [ ] `it shows "Didn't work, tap to retry" on a suggestion when the scene fails`
- [ ] `it disables suggestion buttons while the connection is not connected`

## Acceptance Criteria

- All requirements have passing tests
- A Playwright mock spec taps the playing suggestion and checks the `call_service` message including `transition`
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
