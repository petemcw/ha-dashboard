# Task 005: Sliding Two-Tap Confirm with Outside-Tap Disarm

**Status**: pending
**Depends on**: 001, 004, 009
**Retry count**: 0

## Description

Rework the two-tap confirm for icon actions. On the first tap the button fills red, the icon slides left, and "Confirm?" appears beside it. The second tap sends the action. A tap anywhere else, or keyboard focus leaving the button, cancels it (both new), as does the existing 4-second timeout. This is on a business-critical path (it closes the garage door), so every existing safety rule stays.

## Context

- Related files: `src/features/shared/ConfirmButton.tsx` and `ConfirmButton.test.tsx`, `src/features/home/attention/AttentionAction.tsx`, `leftOnRule.ts` and `thresholdRule.ts` (`confirmLabel` values "Tap to close" / "Tap to confirm"), `src/index.css` (`.button--confirm-armed`), `e2e/attention-controls.spec.ts`, and the existing armed screenshots (`armed-*.png`).
- Keep: `CONFIRM_WINDOW_MS` (4 s), `CONFIRM_GUARD_MS` (500 ms), disarm when the button becomes disabled, and `AttentionAction`'s send-time recheck of `onState`.
- New visible text while armed: "Confirm?". `confirmLabel` becomes the accessible name while armed, e.g. "Confirm close garage door" and "Confirm mark replaced"; update the rules to match. The visually hidden `role="status"` still announces it.
- Outside-tap disarm: while armed, a `pointerdown` anywhere outside the button disarms it. Listen on `document` only while armed and remove the listener on disarm or unmount. A tap on the button itself must not count as outside.
- Blur disarm (decided with the owner): when focus leaves the armed button (`blur`/`focusout`, e.g. Tab), it disarms. A pointer tap on the button itself must not disarm it through a transient blur.
- Motion: the icon's slide and the label's reveal animate `transform`/`max-width`/`opacity` over about 200–250 ms. Under `prefers-reduced-motion: reduce` the armed state appears with no transition. The button grows leftward so the snooze icon to its right doesn't move.
- The button keeps its 44 px hit area in both states.
- Builds on 004's `icon` prop on `ConfirmButton` (004 renders the icon unarmed and pending; this task owns the armed visuals and the armed name).
- No "sent" state. The mock-up turns a confirmed button green with a check for 1.4 s; don't copy that. It would show success before HA reports anything, against principle 10. After the second tap the button shows its pending state (the `aria-disabled` pending style with the icon dimmed or a small spinner, and `pendingLabel` as its name) until `useAction` settles. The row goes away when HA reports the sensor change.

## Requirements (Test Descriptions)

- [ ] `it reveals Confirm beside the action icon on the first tap`
- [ ] `it sends the action on a second tap after the guard window`
- [ ] `it ignores a second tap inside the guard window`
- [ ] `it disarms when the user taps outside the armed button`
- [ ] `it disarms when keyboard focus leaves the armed button`
- [ ] `it disarms after the confirm window passes without a second tap`
- [ ] `it announces the armed confirm to assistive technology`
- [ ] `it shows the armed state without sliding when reduced motion is preferred`

## Acceptance Criteria

- All requirements have passing tests (the reduced-motion requirement may be a Playwright check that the armed element has no running transition, alongside the existing armed screenshots)
- The disarm-on-disabled and send-time recheck tests still pass
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
