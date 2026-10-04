# Task 003: Two-Tap Confirm Button

**Status**: pending
**Issue**: #20
**Depends on**: none
**Retry count**: 0

## Description

Build `ConfirmButton`, the inline tap-twice confirmation used by the garage door and "Mark replaced" actions. The first tap arms it and changes the label to "Tap again to …"; a second tap within about 4 seconds confirms; otherwise it reverts. It has no modal and no hover, and it works on a kiosk.

## Context

- Related files:
  - New: `src/features/shared/ConfirmButton.tsx` (+ `ConfirmButton.test.tsx`), styles in `src/index.css` next to the existing button styles
  - Reference: `src/features/shared/UndoNotice.tsx` (shared feature component, timers), `src/infrastructure/clock/` (if a timer helper fits), `src/app/theme/tokens.css`
- Props: `label` (e.g. "Close garage door"), `confirmLabel` (e.g. "Tap again to close"), `pendingLabel` (e.g. "Closing…", shown while `pending`), `onConfirm`, `disabled?`, `pending?`. Tasks 007 and 008 build against exactly this shape.
- `ConfirmButton` is only a button. It doesn't show failures: the caller renders the shared `ActionError` (task 004) next to it. After a failure, the next tap arms again; a retry always takes two taps (review I9).
- **Double-tap guard (review I9).** A bump or a double tap produces two clicks about 100–300 ms apart, which would arm and confirm in one gesture. Ignore confirming taps for about 500 ms after arming. Playwright specs wait for the "Tap again to …" name before the second click.
- Kiosk rules: touch target at least 44×44 CSS px, nothing hover-only. Use fake timers in tests (`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`).
- An armed button that gets disabled (connection dropped) must disarm, so it can't fire after reconnecting. The revert timer is cleared on unmount.

## Requirements (Test Descriptions)

- [ ] `it does not call onConfirm on the first tap`
- [ ] `it shows the confirm label after the first tap`
- [ ] `it calls onConfirm when tapped again while armed`
- [ ] `it reverts to the original label after four seconds without a second tap`
- [ ] `it disarms when it becomes disabled while armed`
- [ ] `it announces the armed state to screen readers`
- [ ] `it ignores a second tap that comes within half a second of arming`
- [ ] `it shows the pending label and ignores taps while pending`

## Acceptance Criteria

- All requirements have passing tests
- Uses accessible names that Playwright can select by role and name in both states
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
