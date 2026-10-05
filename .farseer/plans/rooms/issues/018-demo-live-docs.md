# Task 018: Demo Rooms, Live Registry Spec, and Docs

**Status**: completed
**Issue**: #63
**Depends on**: 004, 012, 015, 017
**Retry count**: 0

## Description

Give the demo house floors, areas, devices, and entity registry records so `?demo` shows the room selector and room card with working controls. Add a read-only `@live` spec that loads the real registries and lists rooms. Update the docs for rooms.

## Context

- Related files: `src/app/demo/demoHouse.ts` (registries from 019's `placeholderRegistries.ts` floors, areas, and builder; a room with a dimmable color light, a temp-only light, an on/off light, a switch, an input_boolean, a scene, and two media players, one playing; the garage area with `switch.garage_door_opener`), `src/app/demo/installDemo.ts`, `src/infrastructure/fakeHa/placeholderRegistries.ts` (019), `e2e/demo.spec.ts`, new `@live` case in `e2e/rooms.spec.ts`, `e2e/fixtures.ts`.
- Demo mode runs on `testHomeConfig` (`DEMO_HOME_CONFIG` in `src/app/App.tsx`), so the demo's `rooms` and `confirm` are 006's values (`confirm: ['switch.garage_door_opener']`, `awayRoom: 'garage'`). Seed demo entities to match those IDs; don't change `testHomeConfig` here, since every unit test and mocked spec reads it.
- **Live guard.** `FORBIDDEN` in `e2e/fixtures.ts` is `/^(call_service|frontend\/set_.*)$/`. This plan adds the first `config/*` traffic to live tests, which run as an admin. Also block registry writes (`config/<registry>/create|update|delete|remove`, e.g. `/^config\/.+\/(create|update|delete|remove)/`), and count them as unexpected in the end-of-test check, so a live spec can never edit areas, floors, devices, or entities. The four `list`/`list_for_display` reads must still pass through.
- `@live` spec: read-only, real `public/home.json`; assert the selector appears and the picker lists at least one floor heading and one room. It must not tap any control or change the selection in a way that sends anything (selection is local, which is fine). Don't assert real area names in the spec (public repo).
- Docs:
  - `CLAUDE.md` "Status": rooms (selector, Auto with the away source, room card, controls now live in rooms, `rooms`/`confirm` in `home.json`), MDI icons.
  - `.farseer/architecture.md`: `src/infrastructure/registries/`, `src/features/rooms/`, `src/features/shared/` additions (BottomSheet, Slider, tiles, icons), Home column 1 order.
  - `.farseer/domain.md`: glossary entries for **Room** (an HA area with something to control, plus `home.json` tweaks), **Room source**, **Room selection**; avoid "zone" (an HA zone is a location).
  - `docs/feature-decisions.md`: mark rooms shipped in the release order; note what stays out (covers/climate/locks controls, automatic sources).
  - `home.example.json` already has `rooms`/`confirm` from 006; check it matches what shipped.

## Requirements (Test Descriptions)

- [x] `it shows the room selector and a demo room card in demo mode`
- [x] `it dims a demo light and plays a demo media player through the shared fake HA`
- [x] `it asks for a second tap before the demo garage opener toggles`
- [x] `it loads the real registries and lists rooms under floor headings @live`
- [x] `it blocks a registry write from a live test`

## Acceptance Criteria

- All requirements have passing tests
- Docs updated
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Demo: `demoHouse.ts` now seeds the placeholder registries (`DEMO_PLACEMENT`), the living room's temperature and humidity sensors (so the header shows readings), one of each light kind, a switch, an input_boolean, scenes, and full-feature media players.
- Garage opener got a friendly name ("Garage opener") in the demo.
- Live guard: `FORBIDDEN` also blocks `config/<registry>/create|update|delete|remove`; any blocked message except `frontend/set_system_data` now fails the test.
- Docs updated: CLAUDE.md, architecture.md, domain.md, feature-decisions.md. `home.example.json` already matched.
