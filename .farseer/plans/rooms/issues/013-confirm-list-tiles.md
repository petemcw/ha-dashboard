# Task 013: Confirm List on Tiles

**Status**: completed
**Issue**: #55
**Depends on**: 006, 011
**Retry count**: 0

## Description

Every entity in `home.json`'s `confirm` list needs two taps wherever its tile appears, in favorites now and in the room card (012, which builds on this) through the shared `EntityTile`: the first tap arms it ("Confirm?"), the second sends, and tapping elsewhere or waiting disarms it. This lands before the room card, so the garage opener is never one tap away in a room.

## Context

- Related files: `src/features/shared/tiles/EntityTile.tsx` (and `ControlTile` plus the on/off, scene, script tiles it renders), `src/features/shared/ConfirmButton.tsx` (+ CSS, test), new `src/features/shared/useConfirmArm.ts` (+ test), `src/config/useHomeConfig.ts`, `e2e/controls.spec.ts` (favorites).
- **`ConfirmButton` can't wrap a tile as it is**: it renders its own `ActionButton` with a fixed `className`, an `aria-label`, and icon-only content, while `ControlTile` is a full-tile `ActionButton` named by `aria-labelledby` with `aria-pressed`. Extract the arm/disarm behavior into `useConfirmArm({ disabled, onConfirm })`: `CONFIRM_WINDOW_MS` timeout, `CONFIRM_GUARD_MS` double-tap guard, outside-pointer disarm, blur disarm with the `pressing` guard, disarm when disabled, and the live-region text. `ConfirmButton` uses the hook, and its existing tests and the attention specs pass unchanged. `ControlTile` uses it when the entity is confirm-listed.
- 014–017 must not add a one-gesture way around the list: a confirm-listed light gets no drag and no ⋯ button; a confirm-listed media player's power and play/pause use `useConfirmArm`, and it has no volume slider. Expose the "is confirm-listed" answer from `EntityTile` (or a `useConfirmListed(entityId)` hook) so those tasks reuse it.
- The check is by exact `entity_id`. Applies to every control kind a tile sends (on/off, scene, script); display-only tiles are unaffected.
- The armed tile must still show the entity's name, so the user knows what they're confirming; the accessible name while armed includes "Confirm" (e.g. "Confirm: turn off Garage opener").
- Reduced motion: no slide, as `ConfirmButton` does today.

## Requirements (Test Descriptions)

- [x] `it arms a confirm-listed tile on the first tap without sending`
- [x] `it sends on the second tap of an armed tile`
- [x] `it disarms an armed tile on a tap elsewhere and after the confirm window`
- [x] `it applies the confirm list to favorites tiles too`
- [x] `it sends on one tap for a tile that is not in the confirm list`
- [x] `it keeps ConfirmButton's arm, guard, and disarm behavior after the extraction`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `useConfirmArm` (`src/features/shared/useConfirmArm.ts`) holds the arm/guard/disarm logic; `ConfirmButton` uses it and re-exports the CONFIRM_* constants. `ConfirmAnnouncement.tsx` is the shared live region.
- `ControlTile` takes `confirm?: { action }` (in `TileControl`); `EntityTile` sets it from `useConfirmListed(entityId)` (`tiles/useConfirmListed.ts`), which 014-017 reuse. Armed name: "Confirm: turn off X"; state slot shows "Confirm?".
- The favorites requirement is covered via `EntityTile variant="favorite"` (FavoritesSection renders EntityTile directly). BottomSheet flick test flaked once under load, passes on rerun (unrelated).
