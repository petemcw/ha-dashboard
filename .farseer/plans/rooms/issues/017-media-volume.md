# Task 017: Media Volume Slider

**Status**: completed
**Issue**: #62
**Depends on**: 014, 016
**Retry count**: 0

## Description

Active media player rows get a volume slider, built on the shared `Slider`, that shows the dragged level live and sends one `media_player.volume_set` on release. It appears only when the player supports setting volume.

## Context

- Related files: `src/domains/media_player/actions.ts` (`setVolume(gateway, id, percent)` → `volume_level` 0–1), `src/features/rooms/MediaPlayers.tsx`, `src/features/shared/Slider.tsx` (014), `src/infrastructure/fakeHa/fakeHa.ts`.
- `VOLUME_SET=4` gates the slider. A confirm-listed player (013) gets no slider. A muted player shows its muted state next to the slider (display only; muting isn't in scope).
- Like brightness (014), keep showing the released level while the send is pending, then HA's `volume_level`.
- Fake HA: extend 019's `media_player` handler so `volume_set` sets `volume_level`.
- Same gesture rules as brightness (horizontal threshold, `touch-action: pan-y`, keyboard as a slider, send once on release).
- Verify `media_player.volume_set`'s `volume_level` field against HA 2026.9.4.

## Requirements (Test Descriptions)

- [x] `it sends one volume_set with the dragged level on release`
- [x] `it shows the dragged volume while dragging`
- [x] `it shows a volume slider only when the player supports setting volume and isn't confirm-listed`
- [x] `it changes volume with arrow keys as a slider`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes
`setVolume(gateway, id, percent)` sends `volume_set` with `volume_level` = percent/100 (0-1 float; VOLUME_SET = 4). `VolumeSlider` in `MediaPlayers.tsx` reuses `useSliderGesture` and `Slider`; the track div is the drag surface (`touch-action: pan-y`). Hidden for confirm-listed players and players without VOLUME_SET. A muted player shows a muted icon beside the slider. Fake HA's media_player handler sets `volume_level`. E2E drag test added in `e2e/rooms.spec.ts`. Component tests passed on first run because the slider was built in one step with the first test.
