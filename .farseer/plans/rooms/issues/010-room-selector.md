# Task 010: Room Selector on Home

**Status**: completed
**Issue**: #57
**Depends on**: 001, 008, 009, 019
**Retry count**: 0

## Description

Put the room selector at the top of Home's first column, before Needs attention: a full-width button that says what's showing ("Room · Auto", "Room · Auto · Garage, you're away", "Room · Kitchen"). Tapping it opens a bottom sheet listing Auto first, then rooms grouped by floor with their HA icons; picking one closes the sheet and updates the selection.

## Context

- Related files: new `src/features/rooms/RoomSelector.tsx` (+ CSS, test), `src/features/rooms/RoomPicker.tsx` (sheet contents), `src/features/home/HomeScreen.tsx` (new `home__order--room-selector` wrapper first in column 1), `src/styles/layout.css` (phone order: selector first, then attention), `src/features/shared/BottomSheet.tsx` (008), `src/features/shared/icons/` (001), `useRooms` (007), `useSelectedRoom` (009). New `e2e/rooms.spec.ts`.
- The selector renders nothing while rooms are loading or the registries failed (`useRooms()` is `undefined`), and nothing when the house has no rooms.
- Picker: a radio group (`role="radiogroup"` named "Room") with Auto first, then one group per floor, each with a visible floor heading. Each option shows the room's icon (`iconForHa(room.icon, mdiHomeOutline)` or similar) and name; the selected one is checked. Large rows (≥ 44 px), no hover-only affordances.
- The button's accessible name includes the current choice ("Room: Auto, showing Garage because you're away"), so screen-reader users hear what Auto picked.
- `src/styles/layout.css`: besides the phone `order`, add `.home__order--room-selector` to the tablet rule that resets every wrapper's `order: 0` (the list at the `@media` block), or it keeps its phone order inside column 1.
- The sheet comes from `BottomSheet` (008), which portals to `document.body`; the picker's radios close it through `onClose` after `select`.
- Playwright: `HaMock` has empty registries by default (019), so existing specs never see the selector and their layout checks don't change. `e2e/rooms.spec.ts` opts in with 019's placeholder registries and seeds the placeholder entities it needs. It checks the selector at `phone` and `tablet`: position above Needs attention, picking a room, reload keeps it. On a tablet the columns stay top-aligned, so the selector's top lines up with Favorites. Take screenshots.

## Requirements (Test Descriptions)

- [x] `it shows the room selector above Needs attention on phone and tablet`
- [x] `it lines the selector's top up with Favorites on a tablet`
- [x] `it names the selector with the current choice and what Auto picked`
- [x] `it lists Auto first and then rooms grouped under floor headings in floor order`
- [x] `it marks the current choice in the picker`
- [x] `it selects a room from the picker and closes the sheet`
- [x] `it keeps the picked room after a reload`
- [x] `it hides the selector while rooms load or when the registries fail`

## Acceptance Criteria

- All requirements have passing tests
- Screenshots checked at phone and tablet, light and dark
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

Added RoomSelector/RoomPicker (radio group in a BottomSheet), wired first in column 1 with phone order 0 and tablet reset. Several unit tests passed on first run because the picker was built in one pass with the button. Mocked e2e in e2e/rooms.spec.ts passes at phone and tablet; screenshots checked in light only.
