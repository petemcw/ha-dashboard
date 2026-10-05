# Task 015: Light Detail Sheet

**Status**: completed
**Issue**: #60
**Depends on**: 008, 014
**Retry count**: 0

## Description

Lights that support color temperature or color get a visible ⋯ button on their room tile. It opens a bottom sheet named after the light with a color-temperature slider (limited to the light's own Kelvin range) and a row of color swatches, each shown only when the light supports it. Changes send on release or tap.

## Context

- Related files: `src/domains/light/actions.ts` (`setColorTemp(gateway, entityId, kelvin)`, `setColor(gateway, entityId, hs)`), `src/domains/light/viewModel.ts` (`supportsColorTemp`, `supportsColor`, `minKelvin`, `maxKelvin`, current `colorTempKelvin`, `hsColor`), `src/domains/light/factories.ts`, new `src/features/rooms/LightDetailSheet.tsx` (+ CSS, test), the light tile (⋯ button in the `trailing` slot 014 built; it stops pointer propagation so pressing it never starts a drag), `src/features/shared/BottomSheet.tsx` (008; it portals to `document.body`, so rendering it from inside the tile is fine), `src/features/shared/Slider.tsx` (014), `src/infrastructure/fakeHa/fakeHa.ts` (extend 019's `light` handler: `color_temp_kelvin` and `hs_color` set the attribute and `color_mode`, and turn the light on).
- Support comes from `supported_color_modes`: color temp when it includes `color_temp`; color when it includes any of `hs`, `xy`, `rgb`, `rgbw`, `rgbww`. Range from `min_color_temp_kelvin`/`max_color_temp_kelvin`. Verify the attribute and `light.turn_on` field names (`color_temp_kelvin`, `hs_color`) against HA 2026.9.4.
- Swatches: a fixed set of 8 (warm white is the temp slider's job, so swatches are colors: red, orange, yellow, green, cyan, blue, purple, pink), sent as `hs_color`. Each swatch is a button named by its color; the active one (nearest to the light's current `hs_color` when it's in a color mode) is marked pressed.
- The sheet also repeats the brightness slider, so a phone user can dim with a bigger target.
- The ⋯ button is a compact icon button named "More controls for <light>". No long-press or other hidden gesture.
- **Off lights.** Turning a light off while its sheet is open keeps the sheet open and the controls enabled: a temperature or color change on an off light sends `light.turn_on` with that value, which turns it on. HA drops `color_temp_kelvin` and `hs_color` from an off light's attributes, so there is no current value to show: while off, the temperature slider rests mid-range with `aria-valuetext` saying the light is off, and no swatch is pressed. (Disabled and failure rules still apply when the light isn't `ok` or the connection is down.)
- A confirm-listed light (013) gets no ⋯ button.

## Requirements (Test Descriptions)

- [x] `it shows a more-controls button only on lights that support color temperature or color`
- [x] `it opens a sheet named after the light from the more-controls button`
- [x] `it limits the color temperature slider to the light's Kelvin range and sends color_temp_kelvin on release`
- [x] `it shows color swatches only for color lights and sends hs_color on tap`
- [x] `it marks the swatch nearest the light's current color as pressed`
- [x] `it shows an inline failure when HA rejects a color change`
- [x] `it turns an off light on with the chosen color temperature`
- [x] `it shows no more-controls button on a confirm-listed light`

## Acceptance Criteria

- All requirements have passing tests
- Screenshots checked at phone and tablet, light and dark
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Sheet lives in `src/features/shared/tiles/LightDetailSheet.tsx` (not `features/rooms/`) so the shared tile can import it without a shared-to-rooms dependency.
- `Slider` gained optional `scale`, `restingValue`, `valueText` (Kelvin range; exact value when not dragging).
- Added `lightViewModel` color fields, `setColorTemp`/`setColor`, fake HA light handler for `color_temp_kelvin`/`hs_color`, and an e2e spec with screenshots (`light-sheet-*.png`).
