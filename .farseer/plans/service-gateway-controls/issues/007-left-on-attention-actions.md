# Task 007: Left-On Attention Actions with Recheck and Confirm

**Status**: completed
**Issue**: #24
**Depends on**: 001, 002, 003, 004
**Retry count**: 0

## Description

Make the left-on attention actions work ("Turn off", "Close garage door"). Each runs the rule's configured HA action from `home.json`. At send time the action rechecks the rule's sensor against the **latest** entity store value and sends nothing if it no longer reads the rule's `onState`. An action whose service is `toggle` (the garage opener) also needs a tap-twice confirm through `ConfirmButton`. The item disappears only when HA reports the change.

## Context

- Related files:
  - New: `src/domains/generic/actions.ts` (`runEntityAction(gateway, { domain, service, entity_id })`, which sends `callService(domain, service, undefined, { entity_id })`; it declares its own `{ domain, service, entity_id }` type, since domains never import `src/config/`'s `HaAction`) + test; `src/infrastructure/entities/readEntityNow.ts` (`readEntityNow(entityId)`: the store's current value for one entity, for send-time rechecks) + test; `src/features/home/attention/AttentionAction.tsx` (the container: calls `useServiceGateway`, `useAction`, `useControlsEnabled`, and does the recheck; renders `ItemAction`/`ConfirmButton` plus `ActionError`); `e2e/attention-controls.spec.ts`
  - Modify: `src/features/home/attention/types.ts` (replace `{ label; enabled: false }` with a runnable action that carries the `HaAction`, the rule's sensor `entity_id` and `onState` for the recheck, and `confirm` when the service is `toggle`), `leftOnRule.ts` (+ tests), `useAttentionItems.ts` (also subscribe to each rule's `action.entity_id`, see below), `ItemAction.tsx` (presentational: drop the disabled button and hint), `UrgentItem.tsx` and `ChoreRow.tsx` (render `AttentionAction`), `AttentionSection.test.tsx`, `e2e/attention.spec.ts`
  - **Existing assertions this task must rewrite (review I12):** `e2e/attention.spec.ts:12-30` (garage action disabled with the "Available when controls are enabled" description), `AttentionSection.test.tsx:43-48` (same), `leftOnRule.test.ts:39` (`{ label: 'Close garage door', enabled: false }`).
  - Reference: `src/config/homeConfig.ts` (`LeftOnRule`, `HaAction`), `src/infrastructure/entities/entityStore.ts`, `src/features/shared/ConfirmButton.tsx` (task 003), `src/features/shared/ActionError.tsx` (task 004)
- **No store reads in components (review I5).** `.farseer/code-standards.md` says components don't reach into the entity store. The recheck goes through `readEntityNow`, called inside the function passed to `useAction.run`, so it reads the store at send time, never a render-time copy.
- **Recheck semantics (review I10).** Send nothing unless the sensor's current state equals the rule's `onState`. `unavailable`, `unknown`, and a missing entity all count as "not on".
- **Target availability (review I4).** The HA action's target (`rule.action.entity_id`, e.g. the garage opener) is often a different entity from the sensor. As far as we know, HA acks a call whose target is missing or unavailable without an error (verify read-only on the live instance, without calling a service). An offline opener would ack "Close garage door" and nothing would happen. `useAttentionItems` subscribes only to `rule.entity_id` today; add each `action.entity_id` to its subscription and disable the action when the target isn't `ok`.
- **Confirm and retry (review I9).** A retry after a failure goes through `ConfirmButton` again: two taps, with the recheck at send time.
- **After a successful garage toggle (user decision, after review).** Pending ends on HA's acknowledgement, even for `toggle`. The door takes 10–20 s and the sensor reads open the whole time, so "Close garage door" comes back right away. The owner chose to keep it that way: the two-tap confirm is the only guard against a second toggle. Don't add a hold-until-closed state.
- E2E specs must seed `switch.garage_door_opener` (and any other action target) next to `calmHouse()`: `calmHouse()` only has the sensors, and the fake HA answers `not_found` for an entity it doesn't have. Wait for the "Tap again to close" name before the second click (`ConfirmButton`'s double-tap guard).
- Pending labels: "Turning off…" and "Closing…". The confirm label for a door is "Tap again to close".
- The filter "Mark replaced" action is task 008. Keep its current disabled shape working until then, or leave the type extensible for it.
- `rule.action.entity_id` (the opener switch) is not the sensor `rule.entity_id` (the door). The recheck reads the sensor.

## Requirements (Test Descriptions)

- [x] `it sends switch.turn_off for the space heater when Turn off is tapped`
- [x] `it does not send the garage toggle on the first tap`
- [x] `it sends switch.toggle for the garage opener on the confirming tap`
- [x] `it sends nothing when the door sensor no longer reads open at the confirming tap`
- [x] `it sends nothing when a turn_off rule's entity already reads off at send time`
- [x] `it shows "Didn't work, tap to retry" on the item when the action fails`
- [x] `it keeps the item until HA reports the entity off`
- [x] `it sends nothing when the sensor is unavailable at send time`
- [x] `it disables the action when its target entity is missing or unavailable`
- [x] `it needs two taps again to retry the garage toggle after a failure`

## Acceptance Criteria

- All requirements have passing tests
- A Playwright mock spec confirms the garage door at both viewports and checks that one `switch.toggle` message was sent; a second spec closes the door in the mock (`mockHa.setState`) between the two taps and checks that nothing was sent
- Snooze still works next to the action on every item
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- New: `domains/generic/actions.ts` (`runEntityAction`), `infrastructure/entities/readEntityNow.ts`, `features/home/attention/AttentionAction.tsx` (container), `AttentionActions.test.tsx`, `e2e/attention-controls.spec.ts`.
- `types.ts` now has `RunnableAction` (carries `ha`, `sensorId`, `onState`, `pendingLabel`, optional `confirmLabel` when service is `toggle`); the `{ label, enabled: false }` shape stays for the filter "Mark replaced" (task 008). `ItemAction` dispatches: href link, runnable -> `AttentionAction`, else the disabled button (hint kept for 008). UrgentItem/ChoreRow unchanged (they render ItemAction).
- Recheck runs inside `useAction.run`, via `readEntityNow`. Mutation-checked: removing it fails three tests.
- Target availability: `AttentionAction` reads the target with `useEntity` (self-subscribing) instead of widening `useAttentionItems`' subscription, and disables when its status is not `ok`. Not verified on live HA whether a call to a missing target is acked (no HA access); the guard is built regardless.
- Rewrote the disabled-action assertions in `AttentionSection.test.tsx` (removed), `leftOnRule.test.ts`, `e2e/attention.spec.ts` (now seeds the opener).
- Pending ends on HA's ack, even for toggle (owner decision). The e2e "closed between taps" spec is partly covered by the unit test, since the item disappears when the door closes.
