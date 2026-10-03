# Task 013: Suggestions strip (disabled)

**Status**: pending
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

- [ ] `it suggests the media viewing mood while the Apple TV is playing`
- [ ] `it suggests brighter lights while the Apple TV is paused`
- [ ] `it shows no suggestions while the Apple TV is idle, off, standby, or unavailable`
- [ ] `it renders a suggestion as a disabled action with an explanation`

## Acceptance Criteria

- All requirements have passing tests
- Coverage ≥ 80% for `src/domains/media_player`
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
