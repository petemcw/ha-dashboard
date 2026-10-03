# Task 013: Suggestions strip (disabled)

**Status**: completed
**Depends on**: 001, 003
**Retry count**: 0

## Description

Show context suggestions in their own strip, apart from attention: while the family room Apple TV is playing, suggest "Media viewing mood"; while it's paused, suggest "Bright up lights". In v1 each suggestion is a disabled button, since running a scene changes devices.

## Context

- Related files: `src/config/home.ts` (`suggestions`), `src/features/home/HomeScreen.tsx` (suggestions region), `src/domains/factories.ts`
- New: `src/domains/media_player/` (`types.ts`, `viewModel.ts` with `playback: 'playing' | 'paused' | 'idle' | 'off' | 'standby' | 'other'` plus `unavailable`/`unknown`/`missing`, `factories.ts`), `src/features/home/suggestions/` (`suggestionRules.ts` pure, `SuggestionsStrip.tsx`).
- Today's Lovelace rules: "dim" shows when the player is not `off`, `standby`, or `idle` (so also `playing` and anything else); "brighten" shows when `on` or `paused`. Decided: dim only while `playing`, brighten only while `paused`. Nothing for any other state.
- The strip is hidden entirely when there are no suggestions. Task 014's live smoke treats this region as optional for that reason.
- `src/domains/media_player/factories.ts` follows the factory import rule in task 003. If you add a Playwright spec, put it in `e2e/suggestions.spec.ts`.
- Disabled button labelled with the suggestion name and described by "Available when controls are enabled". Scene ID and transition stay in config for the controls phase.
- Visually distinct from attention (no warning color, a "Suggestions" heading).

## Requirements (Test Descriptions)

- [x] `it suggests the media viewing mood while the Apple TV is playing`
- [x] `it suggests brighter lights while the Apple TV is paused`
- [x] `it shows no suggestions while the Apple TV is idle, off, standby, or unavailable`
- [x] `it renders a suggestion as a disabled action with an explanation`

## Acceptance Criteria

- All requirements have passing tests
- Coverage ≥ 80% for `src/domains/media_player`
- Code follows code standards

## Implementation Notes

- `src/domains/media_player/` (types, viewModel, factories with `mediaPlayer(state)` and `APPLE_TV_ID`) and `src/features/home/suggestions/` (`suggestionRules.ts`, `SuggestionsStrip.tsx`) plus tests and `e2e/suggestions.spec.ts` (mock-backed, phone and tablet).
- The strip returns null when nothing is suggested (no region), so `src/features/home/HomeScreen.test.tsx` no longer expects a 'Suggestions' region on an empty entity map; I removed it from that list (one-line edit).
- Buttons are `disabled` with `aria-describedby` pointing at the hint text; no `call_service`, scene ids stay in config.
- Tests ran under Vitest and Playwright (mock) and passed; format, lint and tsc clean for my files. Tests and implementation were written together per slice rather than strictly red first.
