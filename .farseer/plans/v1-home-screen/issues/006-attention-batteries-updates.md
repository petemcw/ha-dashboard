# Task 006: Attention chores: low batteries and pending updates

**Status**: pending
**Depends on**: 001, 003, 005
**Retry count**: 0

## Description

Add the chore tier: a compact row under the urgent items. Fill it with a generalized low-battery rule (any battery sensor below 20%, minus an ignore list) and the three specific update rules. Missing-entity items from task 005 move into this row.

## Context

- Related files: `src/config/home.ts` (`batteryRule`, `updateRules`), `src/features/home/attention/` (types, `useAttentionItems.ts`, `AttentionSection.tsx`), `src/domains/binary_sensor/`, `src/infrastructure/entities/`
- New:
  - `src/domains/sensor/` (`types.ts`, `viewModel.ts` with `numericValue` and `deviceClass`, `factories.ts` including a battery sensor), `src/domains/update/` (`viewModel.ts`: pending when state is `on`, with `installed_version`/`latest_version`; `factories.ts`).
  - `src/features/home/attention/batteryRule.ts`, `updateRule.ts`, `ChoreRow.tsx`.
- The battery rule is generalized, so it needs every entity whose `attributes.device_class === 'battery'` and `entity_id` starts with `sensor.`. Add a selector hook in infrastructure that selects entity IDs by predicate (`useEntityIds(predicate)`) and only re-renders when the matching ID set changes; don't pass the whole map down the tree.
  - The predicate receives the state object (`(entity: HassEntity) => boolean`), so task 012's search can match on `friendly_name`. Callers memoize it; the hook recomputes when the predicate identity changes.
  - `useSyncExternalStore` has no equality argument: `getSnapshot` must return the **same array reference** while the matching ID set is unchanged (cache the last result and compare by contents). Returning a fresh array each call loops or warns "The result of getSnapshot should be cached".
- Follow the rule result contract from 005: battery `resolvedIds` are the battery sensors that are present, numeric, and at or above the threshold; update `resolvedIds` are update entities present and not `on` (and the Docker image sensor when `off`). Unavailable/unknown are neither.
- Factories follow the factory import rule in task 003. Playwright spec goes in `e2e/attention.spec.ts`.
- Battery: active when the numeric state is below the threshold (20). Non-numeric (`unavailable`, `unknown`) → not active. Item id `battery-low:<entity_id>`, title from `friendly_name`, detail "12%".
- Updates: `update.*` active when state `on` (detail "4.3.5 → 4.3.10" when versions exist); `binary_sensor.docker_hub_update_available` active when `on` with the label from config. Item ids `update:<entity_id>`.
- Chores render compactly (one line each, still ≥ 44 px tall touch target), after urgent items.

## Requirements (Test Descriptions)

- [ ] `it lists a battery sensor below 20 percent as a chore`
- [ ] `it does not list a battery sensor at 20 percent or above`
- [ ] `it ignores battery sensors on the ignore list`
- [ ] `it ignores a battery sensor with a non-numeric state`
- [ ] `it lists a pending update with its installed and latest versions`
- [ ] `it lists the Home Assistant Docker image when its update sensor is on`
- [ ] `it renders chores in a compact row after urgent items`
- [ ] `it does not re-render a predicate subscriber when an unrelated entity changes`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec seeds a low battery and a pending update)
- Coverage ≥ 80% for the new `src/domains/*` and infrastructure selector
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
