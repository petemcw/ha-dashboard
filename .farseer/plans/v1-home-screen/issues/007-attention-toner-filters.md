# Task 007: Attention chores: printer toner and filters due

**Status**: completed
**Depends on**: 001, 003, 005, 006
**Retry count**: 0

## Description

Add the remaining threshold chores: printer toner below 15% with a working reorder link, and the three filters with fewer than 5 days left, each with a disabled "Mark replaced" action. Overdue filters (negative days) show as overdue.

## Context

- Related files: `src/config/home.ts` (`tonerRule`, `filterRules`), `src/features/home/attention/` (types, `useAttentionItems.ts`), `src/domains/sensor/` (from task 006), `ChoreRow.tsx` (from task 006)
- New: `src/features/home/attention/thresholdRule.ts` (generic "numeric state below N" rule used by both), wiring in `useAttentionItems.ts`.
- Toner: active when the numeric state is below 15. Action is a link (`<a href target="_blank" rel="noopener noreferrer">`) labelled "Reorder toner"; links are allowed in v1 because they don't change devices. `sensor.family_room_printer_ink` is often `unavailable`, so it must not show then.
- Filters: active below 5. Detail "3 days left", "Due today" at 0, "Overdue by 117 days" when negative (the fridge water filter is at -117 today). Action: disabled button "Mark replaced" with the "Available when controls are enabled" description; its script ID comes from config for later.
- Item ids: `toner-low`, `filter-due:<entity_id>`.
- Both items render in the chore row from task 006.
- Follow the rule result contract from 005: `resolvedIds` holds the toner or filter ids whose sensor is present, numeric, and at or above the threshold. An `unavailable` toner sensor (common) is neither active nor resolved, so a snooze on it survives the flapping.
- Playwright spec goes in `e2e/attention.spec.ts`.

## Requirements (Test Descriptions)

- [x] `it lists printer toner below 15 percent with a reorder link`
- [x] `it does not list printer toner while the sensor is unavailable`
- [x] `it lists a filter with fewer than 5 days left`
- [x] `it shows an overdue filter as overdue by its number of days`
- [x] `it renders Mark replaced as a disabled action`
- [x] `it does not report an unavailable toner sensor as resolved`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec seeds an overdue filter)
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `thresholdRule.ts`: generic below-N rule behind `tonerLowRule` and `filterRule` (ids `toner-low`, `filter-due:<entity_id>`). Missing entity yields the missing-entity chore; non-numeric (unavailable) is neither active nor resolved. Wired in `useAttentionItems.ts`.
- New `ItemAction.tsx` renders disabled buttons (with the "Available when controls are enabled" description) and external links (`target=_blank`, `rel=noopener noreferrer`); `UrgentItem` and `ChoreRow` both use it.
- Because toner and filter sensors now count as configured, `AttentionSection.test.tsx` and the `calmHouse` seed in `e2e/attention.spec.ts` also seed calm toner/filter sensors. Other specs that mock HA only show extra missing chores, none asserted on.
- Unit tests were written as one batch (thresholdRule.test.ts) rather than strict one-at-a-time; all passed on first implementation. Playwright adds the toner/overdue filter spec.
- Not mine: `src/infrastructure/ha/startupRetry.test.ts` fails 3 tests (task 015 in progress).
