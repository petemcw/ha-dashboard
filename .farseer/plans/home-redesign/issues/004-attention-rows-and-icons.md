# Task 004: Attention Rows with Kinds, Icons, and Icon Actions

**Status**: pending
**Depends on**: 001, 009
**Retry count**: 0

## Description

Give every attention item a kind and an icon, and render each item as one row: an icon badge (red for urgent, ochre for chores), the title and detail, then the item's action as an icon button and snooze as a clock icon on the right. Accessible names stay as they are today, so the icons change how the row looks, not what it says.

## Context

- Related files: `src/features/home/attention/types.ts`, `leftOnRule.ts`, `batteryRule.ts`, `updateRule.ts`, `thresholdRule.ts`, `ruleResult.ts`, `UrgentItem.tsx`, `ChoreRow.tsx` (they share markup; fold them into one row component if that's cleaner), `ItemAction.tsx`, `AttentionAction.tsx`, `SnoozeMenu.tsx`, `src/features/shared/ActionButton.tsx`, `src/config/homeConfig.ts` (`LeftOnRule`), `home.example.json`, `src/config/testHomeConfig.ts`, `src/index.css`, and the attention tests and e2e specs (`attention.spec.ts`, `attention-controls.spec.ts`, `snooze.spec.ts`).
- Depends on 009 because both tasks edit `homeConfig.ts`, `homeConfig.test.ts`, `home.example.json`, and `testHomeConfig.ts`. Build on 009's version of those files. Give the placeholder garage rule `icon: 'garage'` and the heater rule `icon: 'heater'` in `testHomeConfig.ts` and `home.example.json`.
- Add `kind: 'left-on' | 'battery' | 'update' | 'toner' | 'filter' | 'missing'` to `AttentionItem`, plus an `icon` name for the row badge. Left-on items take the rule's optional `icon` from `home.json`. The allowed set is `'garage' | 'door' | 'heater' | 'light' | 'fan' | 'power'`, and the default comes from the action domain (light → light, fan → fan, otherwise power). Every other kind has a fixed icon: battery, update, filter, toner (printer), missing (help/question).
- The action icon is separate from the badge icon. Left-on `turn_off` uses power, a left-on `toggle` on a garage door uses a close-garage icon, filter "Mark replaced" uses a check/refresh icon, and the toner link uses a cart. Pick `lucide-react` icons and keep the mapping in one pure function with a test.
- Lucide (`lucide-react` 1.x) has **no garage icon**. Use `Warehouse` for the `garage` badge and `ArrowDownToLine` (or `DoorClosed`) for the close-garage action. Other names to use: `door` → `DoorOpen`, `heater` → `Heater`, `light` → `Lightbulb`, `fan` → `Fan`, `power` → `Power`, battery → `BatteryLow`, update → `CircleArrowUp`, filter → `AirVent`, toner → `Printer`, missing → `CircleQuestionMark` (`CircleHelp` was renamed), cart → `ShoppingCart`, snooze → `AlarmClock` or `Clock`. Check each name compiles against the installed version.
- Import each icon by name (`import { Warehouse } from 'lucide-react'`) and return it from a `switch` or object literal. Never use `import { icons }`, `DynamicIcon`, or `import * as`: those bundle all ~1,800 icons.
- Icon action buttons keep their current accessible names ("Close garage door", "Turn off", "Mark replaced", link "Reorder toner") via `aria-label`. Pending and failure states from `useAction` still apply, with the pending label as the accessible name while pending.
- `ConfirmButton` (used for the garage toggle and "Mark replaced") belongs to this task as far as the icon goes: add an `icon?: ReactNode` prop and render the icon with `aria-label` set to `label` (unarmed) or `pendingLabel` (pending). Leave the armed state as it is today (the `confirmLabel` text and `.button--confirm-armed`); 005 replaces the armed visuals and the armed name. `ActionButton` gets the same treatment for non-confirm actions.
- The inline failure (`ActionError`, a `role="status"` span that `AttentionAction` renders next to the button) must not widen the actions column. Show it on its own line under the row's text, spanning the row, and keep the live region rendered (empty) when there's no failure so screen readers still announce it.
- Snooze becomes a 34 px clock icon button named "Snooze {title}". Tapping it swaps the row's actions for today's inline "1 day · 1 week · Cancel" group; focus handling stays as it is.
- Row spacing from the mock-up: 8 px between rows, 10 px padding (12 px on the left), a 32 px badge with a 9 px radius, actions right-aligned and never wrapping under the text. Long titles wrap within their column.
- Keep everything 005 and 006 own out of this task: the confirm visuals and the empty-card behavior.

## Requirements (Test Descriptions)

- [ ] `it gives every attention item the kind of the rule that raised it`
- [ ] `it uses the icon named on a left-on rule and rejects an unknown icon name`
- [ ] `it shows an item's icon badge, title, and detail in one row with its actions on the right`
- [ ] `it shows an item's action as an icon button that keeps the action's name`
- [ ] `it shows the toner reorder link as an icon link named Reorder toner`
- [ ] `it shows snooze as a clock icon button that opens the one day and one week choices`
- [ ] `it shows an action's failure on its own line under the row without moving the action buttons`

## Acceptance Criteria

- All requirements have passing tests
- Existing attention action tests still pass (send-time recheck, disabled when the target isn't ok, inline failure)
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
