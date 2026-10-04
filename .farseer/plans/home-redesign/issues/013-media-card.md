# Task 013: Media Card (Display-Only)

**Status**: pending
**Depends on**: 001, 009
**Retry count**: 0

## Description

Add the Media card under Systems in column 3. It shows the configured player that's playing (or paused): artwork, title, artist, the room, and the volume level, with the other players as small state chips and an "N playing" chip in the header. It has no transport controls; those are a later plan. It renders only when `home.json` has a `media` section.

## Context

- Related files: `src/domains/media_player/` (`types.ts`, `viewModel.ts`, `factories.ts`), `src/domains/person/viewModel.ts` (resolves `entity_picture` against the HA URL: reuse that helper or extract it to a shared spot in `src/domains/`), new `src/features/home/media/` (card + pure view model), `src/features/home/SectionCard.tsx`, `src/features/home/HomeScreen.tsx`, `src/index.css`, and a new `e2e/media.spec.ts`.
- Extend the media player view model with `title` (`media_title`), `artist` (`media_artist`, falling back to `media_album_name` or `app_name`), `artworkUrl` (`entity_picture` resolved against the HA URL; undefined when absent), `volumePercent` (`volume_level × 100`, rounded; undefined when absent), `muted` (`is_volume_muted`), and `friendlyName`.
- Featured player: the first configured player that's `playing`, otherwise the first that's `paused`. With neither, show "Nothing playing" and the chips only.
- Featured row: 52 px artwork (or a music-icon placeholder on the leaf-to-wood gradient from the mock-up), title, artist, and the room (friendly name, leaf color, speaker icon). The volume shows as a read-only level (`meter` or `role="meter"` named "Volume"), with no slider and no buttons.
- The other configured players show as chips: "{friendly name} · Off / Idle / Paused / Playing / Unavailable / Missing".
- Header chip: "{n} playing" in the leaf style when n > 0, otherwise no chip.
- Artwork `img` gets an empty `alt` (decorative) and fails gracefully: on error, fall back to the placeholder. Demo mode must never request an image from anywhere (see `demoHouse.ts`), so demo players have no `entity_picture`.
- The fallback must not stick. `entity_picture` changes with every track (and the proxy URL carries a rotating cache token; an external `http://` artwork URL is blocked as mixed content on the https dashboard). If the error flag isn't reset when `artworkUrl` changes, one bad image hides artwork for every later track for the life of a kiosk session. Key the `img` (or the error state) by URL so a new URL tries again.
- `useHaUrl()` is undefined until the runtime config loads (see `PresenceRow`). Treat that as "no artwork yet" and show the placeholder; don't build a URL against `undefined`.
- Phone order is 6th. Use the order class 001 already defined for the Media slot.
- The shared test house gains a `media` section in 009, so Media becomes a region in every mocked spec. Add "Media" to the reading-order lists in `e2e/home.spec.ts` (`SECTIONS`) and `e2e/smoke.spec.ts` (`order`), and to 001's phone-order spec (6th). 010 and 011 edit the same lines, and 011 also inserts into column 3 in `HomeScreen.tsx` (Systems goes above Media); expect a small merge. If this card lands in column 3 before 011, add the three-equal-columns wall-tablet spec described in 011.

## Requirements (Test Descriptions)

- [ ] `it maps a playing media player to its title, artist, artwork, and volume`
- [ ] `it features the playing player with its title, artist, and room`
- [ ] `it features a paused player when nothing is playing`
- [ ] `it shows Nothing playing when no configured player is playing or paused`
- [ ] `it shows the other configured players as state chips`
- [ ] `it shows how many players are playing in the card header`
- [ ] `it hides the Media card when home config has no media section`
- [ ] `it tries the artwork again when the track's picture changes after a failed load`

## Acceptance Criteria

- All requirements have passing tests, including a Playwright spec on the WebSocket mock
- `src/domains/media_player` stays at or above the 80% coverage gate
- No transport controls are rendered and no media HA actions are added
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
