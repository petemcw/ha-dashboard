# Task 002: Slim Sticky Header Bar with Presence and Clock

**Status**: completed
**Depends on**: 001
**Retry count**: 0

## Description

Replace the tall heartwood sign and its scroll-collapse with the slim header bar from the mock-up: logo, "Maple Frontier" with the greeting under it, presence avatars, a live clock with the date, and the settings button. The bar is square-cornered with a small shadow and stays pinned at the top. The house status sentence goes away; the attention card carries that information now.

## Context

- Related files: `src/features/home/sign/HouseSign.tsx` (rename to a header-bar component, e.g. `HeaderBar.tsx`, in the same folder), `greeting.ts` (kept), `houseStatus.ts` and its tests (removed with the status sentence), `src/features/home/presence/PresenceRow.tsx`, `src/features/home/HomeScreen.tsx`, `src/app/AppShell.tsx`, `src/infrastructure/clock/clock.ts` (`useNow`, ticks every 30 s), `src/index.css` (`.sign-bar`, `.sign*`, presence styles), `src/features/home/sign/HouseSign.test.tsx`, `e2e/sign.spec.ts`, `e2e/presence.spec.ts`, `e2e/home.spec.ts`, `e2e/smoke.spec.ts`.
- Remove `useScrolledUnder`, the IntersectionObserver, the `data-collapsed` styles, and the `aria-hidden` status copy.
- Layout from the mock-up: on tablet and wider, one row with brand and greeting on the left, then avatars, a divider, the clock (time in the slab face, date under it), a divider, then the tool buttons (003 adds the theme toggle beside Settings). Dividers are 1 px `on-wood` at low opacity, with about 20 px of space each side. On a phone: one row of logo, greeting, time and tools (the date and the "Maple Frontier" name are hidden), then the avatars on a second row.
- Avatars are 32 px with a 6 px gap and never overlap. Home is shown by the green dot, away by a dimmed ring, as today.
- Presence keeps its `section` named "People", now inside the `banner` landmark.
- The bar is `position: sticky; top: 0` with `env(safe-area-inset-top)` padding. The ConnectionBanner and demo badge stay where they are.
- Time format follows the user's locale with a small "am/pm" suffix, as in the mock-up; the date reads like "Saturday, Oct 3".
- Tool slot for 003: `HeaderBar` takes a `tools?: ReactNode` prop rendered just before the Settings button, and `HomeScreen` takes the same prop and passes it through. 003 fills it from `AppShell` with the theme toggle. Features can't import `src/app/`, so the toggle has to come in this way rather than from a context in `src/app/theme/`.
- Clock alignment: `useNow` ticks every 30 s from whenever the first subscriber arrived, so a header clock can show the old minute for up to 29 s after it changes, which is easy to see on a wall screen next to a phone. Make the shared clock (`createClock` in `src/infrastructure/clock/clock.ts`) schedule its ticks on wall-clock boundaries (the next :00 or :30 second, re-armed after each tick from the real time so it can't drift over weeks). The attention duration rules keep their 30 s granularity. Update `clock.test.ts` to match.

## Requirements (Test Descriptions)

- [x] `it shows the greeting for the time of day in the header`
- [x] `it shows the current time and date in the header`
- [x] `it updates the header clock when the minute changes`
- [x] `it ticks the shared clock on the wall-clock minute rather than 30 seconds after the first subscriber`
- [x] `it renders the tools passed to the header before the Settings button`
- [x] `it shows the people avatars inside the header banner`
- [x] `it no longer shows a house status sentence`
- [x] `it keeps the header pinned to the top after scrolling on a phone`
- [x] `it lays out the avatars side by side without overlapping`

## Acceptance Criteria

- All requirements have passing tests (pinned and non-overlap requirements are Playwright specs)
- `sign.spec.ts`, `HouseSign.test.tsx`, and the reading-order locator are rewritten for the new structure rather than deleted outright
- The Settings button keeps its name "Settings" and still opens the "Settings" dialog
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `HouseSign` became `HeaderBar` (same folder); `houseStatus.ts` and its tests were removed, `useScrolledUnder` and the `data-collapsed` styles are gone. CSS is a new `.header-bar*` block in `src/index.css` replacing the sign block; the sign's presence styles were shrunk to 32 px avatars with a 6 px gap (the 44 px listitem size assertion in `presence.spec.ts` became a non-overlap check).
- `HeaderBar` takes `tools?: ReactNode` (rendered before Settings) and `people`; `HomeScreen` takes `tools` and passes it through. 003 should pass the toggle from `AppShell`.
- Time uses `Intl.DateTimeFormat` parts so the locale's am/pm marker becomes a small lowercase suffix; date is "Saturday, Oct 3".
- Shared clock now uses `setTimeout` re-armed after each tick to the next multiple of the interval on the wall clock, so ticks land on :00 and :30.
- Rewrote `e2e/sign.spec.ts` (pinned header on phone, no status sentence), `HeaderBar.test.tsx`, smoke order locator (`header section, main section`). Full mocked Playwright suite and Vitest pass; the only format:check failure is the mockup.html.
