# Task 011: Systems Card: Status Chip and Stat Tiles

**Status**: completed
**Depends on**: 001, 009
**Retry count**: 0

## Description

Add the Systems card at the top of column 3. Its header chip says whether the configured status entity is up ("Gateway online" or "Gateway offline"). Below that are four stat tiles: uptime in days, access points online, last backup, and pending updates. It renders only when `home.json` has a `systems` section.

## Context

- Related files: new `src/features/home/systems/` (card + pure view model), `src/domains/sensor/` (`SensorViewModel`), `src/domains/update/` (`UpdateViewModel.isPending`), `src/infrastructure/entities/useEntityIds.ts` + `useEntitiesById.ts` (scan all `update.*`, as `useAttentionItems` does for batteries), `src/infrastructure/clock/clock.ts` (`useNow`), `src/features/home/SectionCard.tsx`, `src/features/home/HomeScreen.tsx`, `src/index.css`, and a new `e2e/systems.spec.ts`.
- Status chip: ok style with "{label} online" when the status entity's state equals `upState`, and danger style with "{label} offline" for any other state. Unavailable or unknown shows "{label} unknown" in the neutral style, and a missing entity shows "{label} missing".
- Uptime: the sensor's state is a boot timestamp (`device_class: uptime`). Days = floor((now − boot) / 1 day), shown as "19 d" with "Gateway" under it (taken from `uptime.label`, not `status.label`). Under a day, show hours. A future or unparseable timestamp counts as unknown. Omit the tile when `uptime` isn't set.
- Access points: "4/5" with "Online" under it, counting `accessPoints.entity_ids` whose state equals `accessPoints.upState` (not `status.upState`; see 009). Missing APs count as offline. Omit the tile when `accessPoints` isn't set.
- Last backup: from a timestamp sensor, "Today" / "Yesterday" / a short date as the main value, with the local time under it. Omit the tile when `backup` isn't set.
- Updates: the count of all `update.*` entities in state `on`, with "Ready to install" under it, or "Up to date" when the count is 0.
- Tiles sit in a 2-column grid with an 8 px gap, a sunken background, a small-caps key, a value in the slab face, and a sub-line, as in the mock-up. Card label "Systems" with a wifi or network icon.
- Phone order is 5th. Use the order class 001 already defined for the Systems slot.
- This is the first card in column 3, so it turns on 001's three-column layout from 1024 px (001 only tested the two-column fallback). Add the three-equal-columns layout spec here. If 013 lands first, it adds the spec instead and this task keeps it passing.
- The shared test house gains a `systems` section in 009, so Systems becomes a region in every mocked spec. Add "Systems" to the reading-order lists in `e2e/home.spec.ts` (`SECTIONS`) and `e2e/smoke.spec.ts` (`order`), and to 001's phone-order spec (5th). 010 and 013 edit the same lines, and 013 also inserts into column 3 in `HomeScreen.tsx` (Systems goes above Media); expect a small merge.

## Requirements (Test Descriptions)

- [x] `it shows Gateway online when the status entity is in its up state`
- [x] `it shows Gateway offline when the status entity is in any other state`
- [x] `it shows the gateway uptime in days from its boot timestamp`
- [x] `it shows how many access points are online out of those configured`
- [x] `it shows when the last backup succeeded`
- [x] `it counts every update entity that has an update ready`
- [x] `it hides the Systems card when home config has no systems section`
- [x] `it counts access points against their own up state, not the status entity's`
- [x] `it shows three equal top-aligned columns on a 1180 by 820 wall tablet` (Playwright)

## Acceptance Criteria

- All requirements have passing tests, including a Playwright spec on the WebSocket mock
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- New `src/features/home/systems/`: `systemsViewModel.ts` (pure: chip tone/text, uptime/AP/backup/updates tiles), `SystemsCard.tsx` (reads config, the clock, configured entities and every `update.*`), tests in `SystemsCard.test.tsx` (13, through the component).
- The card carries `home__order--systems` on the `.card` itself (no wrapper), so with no `systems` section column 3 stays `:empty` and the three-column rule doesn't turn on.
- Tiles are `role=group` named by the tile key; value and unit sit in one element, so tests use `toHaveTextContent` for "19 d" and "1/2".
- Backup and uptime tiles show "Unknown" when the timestamp is missing/unparseable (uptime: also future). Backup time is lower-cased ("3:10 am"). Chip colours use `--ok`/`--danger` (the theme's `--leaf-soft` is not green).
- CSS in its own "Systems card" block at the end of `src/index.css`.
- e2e: `e2e/systems.spec.ts` (mock); `e2e/home.spec.ts` gained Systems in `SECTIONS`/DOM-order/phone-order and the "two columns while third is empty" spec became "three equal top-aligned columns on a 1180 by 820 wall tablet"; `e2e/smoke.spec.ts` order gained Systems (appended; that @live spec's existing order already differs from DOM order).
- Playwright note: concurrent workers share the :5174 server and `test-results/`; use `--output=<scratch>` and rerun on ERR_CONNECTION_REFUSED.
- Not done (012): CPU bars.
