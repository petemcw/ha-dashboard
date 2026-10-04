# Task 008: Filter "Mark Replaced" Runs the Reset Script

**Status**: pending
**Issue**: #25
**Depends on**: 001, 002, 003, 004, 005, 007
**Retry count**: 0

## Description

Make the filter chore's "Mark replaced" action run the rule's `resetScript` through `runScript`, behind the tap-twice confirm. A reset has no undo in the app, so a stray tap must not lose the countdown. The chore disappears when the days-remaining sensor goes back above the threshold.

## Context

- Related files:
  - Modify: `src/features/home/attention/thresholdRule.ts` (`filterRule` builds a runnable script action with `confirm`; + tests), `src/features/home/attention/types.ts` (if task 007's action type needs a script variant), `ItemAction.tsx`, `ChoreRow.tsx`, `AttentionSection.test.tsx`, the Playwright attention controls spec
  - Reference: `src/domains/script/actions.ts` (`runScript`, task 005), `src/features/shared/ConfirmButton.tsx` (task 003), `src/config/homeConfig.ts` (`FilterRule.resetScript`)
- **Existing assertions this task must rewrite (review I12):** `e2e/attention.spec.ts:79` (`Mark replaced` disabled), `AttentionSection.test.tsx:82-95` (Mark replaced disabled with the hint), `thresholdRule.test.ts:61-62` (`{ label: 'Mark replaced', enabled: false }`).
- Use task 007's `AttentionAction` container and `ActionError`. A retry after a failure takes two taps again.
- **Target availability (review I4).** Disable "Mark replaced" when the `resetScript` entity is missing or unavailable (subscribe to it alongside the days-remaining sensor), for the same reason as task 007's opener.
- E2E specs must seed the reset script entity (`script.reset_furnace_filter` etc.): the fake HA answers `not_found` for an entity it doesn't have. Wait for "Tap again to confirm" before the second click.
- Labels: "Mark replaced", then "Tap again to confirm", then "Saving…" while pending.
- The toner chore keeps its `href` link action unchanged.
- No recheck is needed: running a reset script is idempotent if the filter is already fresh.

## Requirements (Test Descriptions)

- [ ] `it does not run the reset script on the first tap of Mark replaced`
- [ ] `it sends script.turn_on for the filter's reset script on the confirming tap`
- [ ] `it shows "Didn't work, tap to retry" on the chore when the script fails`
- [ ] `it keeps the toner chore's reorder link as a link`
- [ ] `it disables Mark replaced when the reset script is missing or unavailable`

## Acceptance Criteria

- All requirements have passing tests
- A Playwright mock spec confirms "Mark replaced" and checks the `call_service` message
- No `disabled`-only action buttons or "Available when controls are enabled" hints remain in `src/features/home/attention/`
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
