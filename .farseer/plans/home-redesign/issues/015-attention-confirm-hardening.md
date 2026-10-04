# Task 015: Attention and Confirm Hardening (Post-Run Audit)

**Status**: pending
**Depends on**: 004, 005, 006
**Retry count**: 0

## Description

Close the gaps a post-run audit found in the attention card and the two-tap confirm. The most visible one: after the confirming tap, the garage button looks unchanged. Only its accessible name switches to the pending label, because the `aria-disabled` pending style 005 relied on was never written. The rest are tests that couldn't fail, untested safety rules on the confirm path, a write-only `kind` field, and one mock-up difference on chore rows.

This is a business-critical path: the confirm closes a real garage door. Keep `CONFIRM_WINDOW_MS` (4 s), `CONFIRM_GUARD_MS` (500 ms), disarm-on-disabled, the send-time recheck in `AttentionAction`, and the service gateway rules. Tests use the fake gateway or the WebSocket mock only.

## Context

- Related files:
  - `src/features/shared/ConfirmButton.tsx`, its `.css` and `.test.tsx`
  - `src/features/shared/ActionButton.tsx` (no CSS file yet), `ActionError.*`, `UndoNotice.*`
  - `src/features/home/attention/`: `AttentionAction.tsx`, `AttentionRow.tsx`, `AttentionSection.tsx` and `.css`, `SnoozedList.tsx`, `attentionIcons.ts`, `types.ts`, `leftOnRule.ts`, and their tests
  - `.oxlintrc.json`
  - `e2e/attention.spec.ts`, `e2e/attention-controls.spec.ts`, `e2e/snooze.spec.ts`
- CSS is per component now (see `.farseer/architecture.md`). Put new styles in the component's own CSS file, not in `src/styles/`.
- The audit with file:line references was in a session scratchpad and may be gone. The items below are self-contained.
- Run Playwright on its own port and output dir when other work shares the checkout: `E2E_PORT=<port> npx playwright test <specs> --grep-invert @live --output=<dir>`.

Items:

1. **Pending style.** 005 says the button shows "the `aria-disabled` pending style with the icon dimmed or a small spinner" until `useAction` settles, but no `[aria-disabled]` rule exists. Add it (e.g. `ActionButton.css` imported by `ActionButton`).
2. **Listener lifecycle.** `ConfirmButton` attaches a `document` `pointerdown` listener while armed. Test that it's attached only while armed and removed on disarm and on unmount.
3. **Confirm window.** The current test only checks the button has disarmed at 4,000 ms, so any window from 600 to 4,000 ms passes. Pin it: still armed and confirmable at about 3,900 ms, disarmed at 4,000 ms.
4. **Reduced motion.** The Playwright check can't fail: there's no no-preference run proving an animation exists, and it skips the button element itself. Fix both.
5. **Stuck `pressing` flag.** `ConfirmButton`'s `pressing` flag stays set when a mouse press is released off the button, so a later Tab-away doesn't disarm (the timeout and outside taps still do). Reset it on a document `pointerup` / `pointercancel`.
6. **Non-door toggle label.** A `toggle` left-on rule that isn't a door builds its confirm label from the action label (e.g. "Confirm turn off"). That's untested.
7. **Badge colours (story 20).** Red badge for urgent, ochre for chores. Nothing asserts it.
8. **Icon mappings.** `attentionIcons` tests check only that the icons are distinct, plus a few by name. Table-test every badge and action mapping.
9. **`kind` is write-only.** `AttentionItem.kind` is set by every rule and read only by its own test. Decision (owner): derive the badge icon from `kind`. Left-on items keep their configured or defaulted icon; every other kind maps to its fixed icon. Drop the redundant `icon` data where it no longer varies.
10. **Lucide import guard.** Nothing stops a namespace import, `icons`, or `DynamicIcon` from `lucide-react`, any of which bundles every icon. Add an oxlint `no-restricted-imports` rule (or equivalent) and show it triggers on a throwaway fixture outside the repo.
11. **Snoozed disclosure (006).** `aria-controls` on the Show/Hide buttons points at an id that isn't in the DOM while collapsed; render the list `hidden` or otherwise keep the id valid. The non-admin test never expands the strip, so "Unsnooze is admin-only" is unverified.
12. **Actions never wrap.** Nothing checks that a row's actions stay on the same line, right-aligned, under a long title on a phone.
13. **Chore rows vs the mock-up.** The mock-up gives chore rows a tinted background and a softer badge; ours have a solid ochre badge on an untinted row. Match it in light and dark.

## Requirements (Test Descriptions)

- [ ] `it shows the pending style with a dimmed icon after the confirming tap until the action settles`
- [ ] `it listens for outside taps only while armed and stops on disarm and unmount`
- [ ] `it stays armed and confirmable just before the confirm window ends`
- [ ] `it animates the armed reveal without a motion preference and not with reduced motion`
- [ ] `it disarms on Tab after a press that was released off the button`
- [ ] `it names the confirm for a toggle rule that isn't a door from its action`
- [ ] `it shows a red badge for urgent items and an ochre badge for chores`
- [ ] `it maps every badge and action icon name to its icon`
- [ ] `it derives the badge icon from the item's kind, keeping the left-on rule's icon`
- [ ] `it rejects a namespace, icons, or DynamicIcon import from lucide-react in lint`
- [ ] `it keeps the snoozed list's aria-controls target in the DOM while collapsed`
- [ ] `it shows no Unsnooze button to a non-admin with the snoozed list expanded`
- [ ] `it keeps a row's actions on the same line, right-aligned, under a long title on a phone`
- [ ] `it tints chore rows and softens their badge as in the mock-up`

## Acceptance Criteria

- All requirements have passing tests, each seen failing first
- The 4 s window, 500 ms guard, disarm-on-disabled, and send-time recheck tests still pass
- `npm run format:check && npm run lint && npm test && npm run build` pass, plus the attention, attention-controls, and snooze Playwright specs
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
