# Task 016: Media Player Rows

**Status**: completed
**Issue**: #61
**Depends on**: 012
**Retry count**: 0

## Description

In the room card, media players get their own section instead of plain tiles: each playing or paused player is a full row with artwork, title, artist, and play/pause, previous, and next; idle, off, and standby players collapse to small chips with a power button. Buttons appear only when the player supports them.

## Context

- Related files: new `src/domains/media_player/actions.ts` (+ test: `play`, `pause`, `nextTrack`, `previousTrack`, `setPower(gateway, id, on)`), `src/domains/media_player/viewModel.ts` and `types.ts` (add `supports: { pause, play, previous, next, volumeSet, turnOn, turnOff }` from `supported_features`), `src/domains/media_player/factories.ts`, new `src/features/rooms/MediaPlayers.tsx` (+ CSS, test), `src/features/rooms/RoomCard.tsx`, `src/infrastructure/fakeHa/fakeHa.ts` (add a `media_player` entry to 019's handler table: `media_play`, `media_pause`, `media_next_track`, `media_previous_track`, `turn_on` (to `idle`), `turn_off` (to `off`)).
- Feature bits (verify against HA 2026.9.4 `MediaPlayerEntityFeature`): `PAUSE=1`, `VOLUME_SET=4`, `PREVIOUS_TRACK=16`, `NEXT_TRACK=32`, `TURN_ON=128`, `TURN_OFF=256`, `PLAY=16384`.
- Play/pause sends explicit `media_play` or `media_pause` from what the row shows, never `media_play_pause`, so a double delivery can't flip it back. Power sends explicit `turn_on`/`turn_off`.
- Active = `playing` or `paused` (the view model's `playback`). Everything else, including `unavailable` and `missing`, is a chip; an unavailable or missing chip has no power button and says so.
- **Power direction.** `off` and `standby` chips offer power on (`turn_on`, only with `TURN_ON`). `idle` and `other` (HA's `on`, `buffering`, and anything unmodeled) are already on, so they offer power off (`turn_off`, only with `TURN_OFF`). No matching feature bit, no button. The button's name says which ("Turn on Kitchen speaker").
- A confirm-listed media player (013) sends power and play/pause only through `useConfirmArm` (two taps).
- Artwork uses the view model's `artworkUrl` (needs the HA URL, as the Home Media card does); no artwork shows the media icon.
- Rows and chips follow every control's rules: disabled while disconnected or not `ok`, inline failure that clears on the next state change.
- Reuse the Home Media card's chip styling where it fits (`src/features/home/media/MediaCard.css`, `Chip`).

## Requirements (Test Descriptions)

- [x] `it shows a playing or paused player as a row with artwork, title, and artist`
- [x] `it sends media_pause on a playing row and media_play on a paused row`
- [x] `it shows previous and next only when the player supports them`
- [x] `it collapses idle, off, and standby players to chips with a power button`
- [x] `it shows an unavailable player as a chip without a power button`
- [x] `it turns a player on from its chip with an explicit turn_on`
- [x] `it turns an idle player off from its chip with an explicit turn_off`
- [x] `it shows no power button when the player doesn't support that direction`
- [x] `it asks for a second tap before sending play, pause, or power to a confirm-listed player`

## Acceptance Criteria

- All requirements have passing tests
- Screenshots checked at phone and tablet, light and dark
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Components: `src/features/rooms/MediaPlayers.tsx` (+ css, test) renders one `<li>` per player, a row when playing/paused, else a chip; `RoomCard` splits media_player ids out of the tile grid. Artwork reuses the exported `Artwork` from the Home Media card.
- `supports` added to the media_player view model; `actions.ts` has play/pause/nextTrack/previousTrack/setPower. Fake HA gained a `media_player` handler (play/pause/turn_on to idle/turn_off to off).
- Confirm gating covers power and play/pause only; prev/next are direct.
- Several tests (actions, unavailable chip, turn_on, unsupported power, confirm) passed on first run because the implementation of the preceding slice already covered them.
- e2e: kitchen media row/chip test added to `e2e/rooms.spec.ts`; screenshots checked at phone/tablet, light/dark. Other rooms specs showed ENOENT only from concurrent Playwright runs.
