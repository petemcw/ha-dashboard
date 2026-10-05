# Task 014: Light Brightness Drag

**Status**: completed
**Issue**: #59
**Depends on**: 012, 013
**Retry count**: 0

## Description

In the room card, a light that can dim becomes a slider: a horizontal drag across the tile sets brightness, shown live on the tile, and one `light.turn_on` with `brightness_pct` goes out on release. A tap still toggles. Build the drag as a reusable `Slider` so media volume (017) and the color-temperature slider (015) share it.

## Context

- Related files: new `src/domains/light/actions.ts` (+ test: `setBrightness(gateway, entityId, percent)`), `src/domains/light/viewModel.ts` (add `canDim` from `supported_color_modes`: anything other than only `onoff`), `src/domains/light/factories.ts`, new `src/features/shared/Slider.tsx` (+ CSS, test), the light tile in `src/features/shared/tiles/` (drag only when `EntityTile`'s `variant` is `room`; favorites stay tap-only this plan; don't edit `RoomCard.tsx`, which 016 changes in parallel), `src/infrastructure/fakeHa/fakeHa.ts` (add the `light` entry to 019's handler table: `brightness_pct` sets the `brightness` attribute, 0–255, and turns the light on).
- Check `light.turn_on`'s `brightness_pct` against HA 2026.9.4 before relying on it.
- **Tile structure.** Today the whole tile is one `ActionButton` (`ControlTile`), so nothing else interactive can go inside it. The dimmable room light tile is an `li` holding three siblings: the toggle `ActionButton` (full tile, also the drag surface), a focusable `role="slider"` element (the brightness fill, keyboard target), and a `trailing` slot that 015 fills with the ⋯ button. Build that slot now so 015 doesn't restructure the tile.
- Gesture: pointer events on the toggle button with `setPointerCapture`, so a drag keeps tracking past the tile's edge; engage only after the pointer moves ~8 px more horizontally than vertically, so a vertical swipe scrolls the page. `touch-action: pan-y` on the tile (the browser then sends `pointercancel` when it takes a vertical scroll). A movement under the threshold is a tap (toggle). Release sends once; a cancelled pointer sends nothing.
- **Swallow the click after a drag.** Pointerdown and pointerup on the same `<button>` fire `click`, so without a guard `ActionButton.onPress` toggles the light at the end of every drag.
- While dragging, the dragged value lives in component state. After release, keep showing the released value while that send is pending (`useAction`'s `pending`: action state, not an entity copy), then show HA's brightness again (principle 10). Without this the fill jumps back to the old level until HA reports the new one, which can take a second. Dragging to 0% sends `turn_off`, not `brightness_pct: 0`.
- A confirm-listed light (013) gets no drag: it stays a two-tap toggle.
- Accessibility: `role="slider"` with `aria-valuenow`/`aria-valuetext` ("40%"); arrow keys step 10%, Home/End go to 1% and 100%, and each key change sends on key up (debounced) rather than per key repeat. The tile's toggle stays a button reachable separately.
- Disabled and failure rules as every control: disabled when not connected or the light isn't `ok`; inline failure clears on the next state change.
- Playwright: drag a placeholder light in the room card and check the fake HA's `brightness`; a vertical swipe over it scrolls and sends nothing.

## Requirements (Test Descriptions)

- [x] `it sends one light.turn_on with brightness_pct when a drag is released`
- [x] `it shows the dragged brightness on the tile while dragging`
- [x] `it turns the light off when dragged to zero`
- [x] `it scrolls the page and sends nothing on a vertical swipe over a light tile`
- [x] `it changes brightness with arrow keys as a slider`
- [x] `it offers no drag on a light that only turns on and off`
- [x] `it still toggles the light on a tap`
- [x] `it doesn't toggle the light when a drag ends`
- [x] `it keeps showing the released brightness while the send is pending`
- [x] `it offers no drag on a confirm-listed light`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Drag gesture is `src/features/shared/useSliderGesture.ts` (pointer surface handlers + keyboard + pending-hold of the released value) with `Slider.tsx` as the role="slider" fill; 017 reuses both. Drag is relative to the starting level; the slider element is `pointer-events: none` over the tile, button is the surface.
- `ControlTile` gained `surface`, `slider`, and `trailing` props (015 fills `trailing`, positioned top right by `.favorite-trailing`). `EntityTile` passes `onDim` only for `variant="room"`, non-confirm-listed, `canDim` lights.
- The click-after-drag guard (`consumeClick`) is behaviorally redundant with `useAction`'s in-flight guard, so its test cannot fail without it; kept per the requirement.
- CSS: `.favorite-tile[data-draggable]` overrides the global button hover/active background and scale, which hid the fill.
- Fake HA `light` handler sets `brightness` from `brightness_pct`. Light with no `supported_color_modes` is treated as non-dimmable.
- Playwright uses mouse drag; a real touch scroll isn't simulated (a vertical mouse move that never engages stands in).
