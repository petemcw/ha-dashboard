# Task 006: Hide the Empty Attention Card; Snoozed Strip

**Status**: completed
**Depends on**: 001, 004, 009
**Retry count**: 0

## Description

When nothing needs attention, the Needs attention card disappears entirely instead of saying "Nothing needs attention". If anything is snoozed, a quiet dashed "N snoozed" strip takes its place and expands to the snoozed list. While the card is showing, its header gets a count chip and its footer opens the same snoozed list.

## Context

- Related files: `src/features/home/attention/AttentionSection.tsx`, `SnoozedList.tsx`, `useAttention.ts` (`items`, `urgent`, `chores`, `snoozed`), `src/features/shared/UndoNotice.tsx`, `src/features/home/HomeScreen.tsx`, `src/index.css` (`.all-clear`), `e2e/attention.spec.ts`, `e2e/snooze.spec.ts`, `e2e/home.spec.ts`.
- Count chip: "2 urgent · 2 chores", "1 urgent", or "3 chores", in the danger style when anything is urgent and the warn style otherwise.
- Snoozed strip: in the attention card's grid slot (first on a phone, top of column 1 elsewhere). It has a dashed `border-strong` outline, no fill, a clock icon, "**N snoozed** · {first title}", and a "Show"/"Hide" button with `aria-expanded`/`aria-controls`. Expanded, it lists each snoozed item: title, detail, "snoozed until {time}", and an "Unsnooze {title}" button for admins only, as `SnoozedList` does today. Replace the `<details>` with this disclosure, keeping the "N snoozed" text that tests look for.
- Card footer: "N snoozed" with a Show button that opens the same list inside the card. Don't show the footer when nothing is snoozed.
- The "Snoozed until …" `UndoNotice` after snoozing must still appear when snoozing the last item hides the card. Render it outside the card, or move it to the strip, so it isn't unmounted with the card.
- Before the first entity map arrives, render neither the card nor the strip (as today, nothing can be judged yet).
- Keep the region name "Needs attention" for the card. Name the strip region "Snoozed".
- `AttentionSection` renders `snoozing.error` (`role="alert"`) and "Snoozes are unavailable." inside the card today. With the card hidden they'd disappear, so a failed Unsnooze from the strip would show nothing. The strip shows `snoozing.error` as well, and the card and strip never both show it.
- The strip goes in 001's attention slot (the same wrapper and phone `order`), so it doesn't need new grid CSS.

## Requirements (Test Descriptions)

- [x] `it shows a count chip with the urgent and chore counts in the attention card header`
- [x] `it hides the Needs attention card when nothing needs attention`
- [x] `it shows a snoozed strip in the card's place when the card is hidden and items are snoozed`
- [x] `it shows neither the card nor the strip when nothing needs attention and nothing is snoozed`
- [x] `it expands the snoozed strip to list snoozed items with Unsnooze for admins`
- [x] `it opens the snoozed list from the attention card footer`
- [x] `it still shows the snoozed-until notice after snoozing the last item`
- [x] `it shows a failed unsnooze in the snoozed strip when the card is hidden`

## Acceptance Criteria

- All requirements have passing tests
- Specs that relied on "Nothing needs attention" are updated to the new behavior
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `AttentionSection` now returns a fragment: the card (only when `items` is non-empty) with a count chip (`attention__chip--danger`/`--warn`), a "N snoozed" footer with Show/Hide, and the expanded list; or the dashed "Snoozed" strip (clock icon, "N snoozed · first title", Show/Hide with aria-expanded/aria-controls) when the card is hidden and items are snoozed. Neither renders if nothing is needed or snoozed. The `UndoNotice` renders outside both so it survives the card unmounting.
- `SnoozedList` is now just the list (takes an `id`); rows show title, "detail · snoozed until {time}", and Unsnooze for admins. Disclosure state lives in `AttentionSection`. The error/"Snoozes are unavailable" lines render in whichever of card/strip is visible.
- CSS: removed `.all-clear`; new "Snoozed strip and card footer (task 006)" block. No grid CSS needed: the strip sits in the existing attention slot wrapper.
- Specs: `e2e/attention.spec.ts` calm-house test now asserts the card is absent; `snooze.spec.ts` checks the strip and notice; `home.spec.ts` uses the Show button. Playwright (attention, snooze, home, mocked): 40 passed. Vitest 496 passed, lint and tsc clean.
