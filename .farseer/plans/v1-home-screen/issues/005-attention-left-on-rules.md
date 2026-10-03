# Task 005: Attention: left-on rules and urgent tier

**Status**: pending
**Depends on**: 001, 003
**Retry count**: 0

## Description

The first attention slice, end to end: domain view models for the entities involved, a pure rule that turns "on/open for at least N minutes" into attention items, a shared clock so items appear without a reload, and the urgent tier rendered in the attention region. This task sets the `AttentionItem` model and the attention list that tasks 006, 007, and 008 extend.

## Context

- Related files: `src/config/home.ts` (`leftOnRules`), `src/features/home/HomeScreen.tsx` (attention region), `src/infrastructure/entities/useEntity.ts`, `src/domains/factories.ts`, `e2e/haMock.ts`
- New:
  - `src/domains/binary_sensor/`, `src/domains/switch/`, `src/domains/light/`: `types.ts`, `viewModel.ts` (`isOn`, `onSince` from `last_changed`, `status: 'ok' | 'unavailable' | 'unknown' | 'missing'`), `factories.ts`.
  - `src/infrastructure/clock/` : one shared clock (`useNow()`), ticking every 30 s, injectable in tests.
  - `src/features/home/attention/`: `types.ts` (`AttentionItem = { id, tier: 'urgent' | 'chore', title, detail, action?: { label, enabled: false } | { label, href } }`), `leftOnRule.ts` (pure), `useAttentionItems.ts` (composes rules; later tasks add theirs here), `AttentionSection.tsx`, `UrgentItem.tsx`.
- Rule semantics: active when the entity is on (door: `on` = open) and `now - last_changed >= minutes`. `unavailable`/`unknown` → not active. Missing entity → a chore item "Missing entity" naming the entity ID (the chore row itself comes in 006; render missing items in a simple list for now and let 006 move them).
- Item id is the rule `id` from config (e.g. `garage-door-left-open`). A missing-entity item's id is `missing:<entity_id>`; snoozes (008) and React keys rely on every item having a stable, unique id.
- **Rule result contract** (006, 007, and 008 build on this). Every rule returns `RuleResult = { items: AttentionItem[]; resolvedIds: string[] }`, and `useAttentionItems()` returns the merged `{ items, resolvedIds }`. An id is **resolved** only when its entity is present and available **and** the condition has cleared. For left-on rules that means off or closed. On but under the duration isn't resolved, because it happens right after an HA restart resets `last_changed`. Unavailable, unknown, missing, or not-yet-loaded entities are neither active nor resolved. Snooze cleanup in 008 only drops snoozes for resolved ids, so this distinction is what keeps a flapping or restarting device from silently losing its snooze.
- Empty state: when no item is active, the attention region stays rendered (labelled) with "Nothing needs attention", so the section order and the live smoke in 014 don't depend on house state.
- Per-domain `factories.ts` files follow the factory import rule in task 003 (explicit `.ts` relative imports, `import type` from the library, no browser globals), because `e2e/haMock.ts` imports them and `tsc -b` checks them under `tsconfig.node.json`.
- Playwright spec goes in `e2e/attention.spec.ts` (006 to 008 extend the same file; they run in sequence).
- Disabled action: a `<button disabled>` with the label (door: "Close garage door"; others: "Turn off") and `aria-describedby` text "Available when controls are enabled". No `call_service` anywhere.
- Item detail shows how long it has been on ("Open for 12 min").
- `last_changed` resets on HA restart; that's accepted (see plan).

## Requirements (Test Descriptions)

- [ ] `it does not flag the garage door before it has been open for 10 minutes`
- [ ] `it flags the garage door once it has been open for 10 minutes`
- [ ] `it flags the space heater after an hour on but not after 59 minutes`
- [ ] `it does not flag an entity that is unavailable or unknown`
- [ ] `it reports a configured entity missing from Home Assistant as a missing-entity item`
- [ ] `it shows a left-on item when the clock passes the threshold without a reload`
- [ ] `it renders the item's action as disabled with an explanation`
- [ ] `it reports a closed garage door as resolved but not one still open under 10 minutes`
- [ ] `it does not report an unavailable entity as resolved`
- [ ] `it shows that nothing needs attention when no rule is active`

## Acceptance Criteria

- All requirements have passing tests (rule tests use factories and an injected `now`; one Playwright mock spec seeds an old `last_changed` and asserts the urgent item)
- Coverage ≥ 80% for the new `src/domains/*` and `src/infrastructure/clock`
- Code follows code standards

## Implementation Notes

(Left blank - filled in by programmer during implementation)
