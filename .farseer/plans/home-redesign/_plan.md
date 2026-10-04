# Plan: Home Screen Redesign

## Created

2026-10-04

## Status

completed

## Objective

Restyle the Home screen to the approved mock-up: a slim sticky header bar, a grid of boxed cards, one-line attention rows with icon actions and a sliding two-tap confirm, and a theme toggle in the header. Then add three new display-only cards: Today (weather), Systems (network, backups, updates), and Media (now playing).

## User Stories

1. As a household member, I want a slim header bar instead of the tall sign, so that the cards that matter start near the top of the screen.
2. As a household member, I want the header to stay pinned when I scroll, so that settings and the time are always within reach.
3. As a household member, I want the header to greet me by time of day, so that the dashboard still feels like ours.
4. As a household member, I want to see who's home as avatars in the header, so that presence is visible without taking a section of its own.
5. As a household member, I want the avatars spaced apart rather than overlapping, so that I can tell each person apart at a glance.
6. As a kiosk user, I want a large clock and the date in the header, so that the wall screen doubles as a clock.
7. As a kiosk user, I want the clock to keep up on its own, so that a screen that's been on for weeks still shows the right time.
8. As a household member, I want a one-tap light/dark toggle in the header, so that I can switch themes without opening settings.
9. As a household member, I want the toggle to show which theme a tap will switch to, so that I know what will happen.
10. As a household member, I want the settings sheet to reflect a theme I picked from the header, so that the two never disagree.
11. As a household member, I want "System" to stay available in settings, so that I can go back to following my device.
12. As a household member, I want every Home section drawn as a card with an icon label and a status chip, so that I can scan the screen quickly.
13. As a kiosk user, I want three equal columns on the landscape wall tablet, so that the whole house fits on one screen.
14. As a tablet user in portrait, I want two columns, so that cards stay readable without wasted space.
15. As a phone user, I want one column ordered attention, suggestions, favorites, weather, systems, media, crypto, so that what needs me comes first.
16. As a phone user, I want no sideways scrolling at any size, so that the page never feels broken.
17. As a household member, I want Needs attention to stand out as the primary card, so that problems aren't lost among the glanceable cards.
18. As a household member, I want a count chip on the attention card ("2 urgent · 2 chores"), so that I know how much is waiting before reading the rows.
19. As a household member, I want each attention item on one row, with its icon, what it is, and its actions on the right, so that the list stays compact.
20. As a household member, I want urgent items to show a red icon badge and chores an ochre one, so that severity is visible without reading.
21. As a household member, I want each item's icon to match what it is (garage, heater, battery, update, filter, toner), so that I recognize items instantly.
22. As the house owner, I want to choose the icon for a left-on rule in `home.json`, so that a garage door doesn't get a generic power icon.
23. As a household member, I want an item's action shown as an icon button, so that the row doesn't wrap on a phone.
24. As a screen reader user, I want icon buttons to keep their spoken names ("Close garage door", "Mark replaced"), so that icons don't hide what a control does.
25. As a household member, I want the toner reorder link shown as a cart icon, so that it matches the other actions.
26. As a household member, I want snooze shown as a clock icon that opens "1 day · 1 week · Cancel" in place, so that snoozing still works the same way.
27. As a household member, I want a confirm-required action to slide its icon aside and show "Confirm?" on the first tap, so that I can see it's armed.
28. As a household member, I want the second tap to send the action, so that confirming is quick.
29. As a household member, I want an armed action to cancel if I tap anywhere else, so that I can back out without waiting.
30. As a kiosk user, I want an armed action to cancel itself after a few seconds, so that an armed garage button doesn't sit on the wall.
31. As a screen reader user, I want the armed state announced, so that I know a second tap will send it.
32. As a user who prefers reduced motion, I want the confirm to appear without sliding, so that motion doesn't bother me.
33. As a household member, I want the attention card to disappear entirely when nothing needs me, so that a calm house shows a calm screen.
34. As a household member, I want a quiet "N snoozed" strip to take the card's place when things are snoozed, so that snoozed items aren't forgotten.
35. As a household member, I want nothing shown at all when there are no items and nothing snoozed, so that the screen isn't cluttered.
36. As an admin, I want to expand the snoozed strip and unsnooze an item, so that I can bring something back early.
37. As a household member, I want the attention card's footer to open the same snoozed list, so that snoozes are reachable either way.
38. As a household member, I want favorites tiles to show an icon for what they control, so that a light and a fan are easy to tell apart.
39. As a household member, I want a tile that's on to show its icon highlighted, so that on and off read at a glance.
40. As a household member, I want buttons that look compact but are still easy to tap, so that the screen is dense without being fiddly.
41. As a household member, I want a Today card with the current temperature, condition, and high/low, so that I know what it's like outside.
42. As a household member, I want the next several hours of forecast, so that I can plan the evening.
43. As a household member, I want humidity, wind, and UV on the Today card, so that I get the details without opening a weather app.
44. As a household member, I want the sunset time, so that I know when it gets dark.
45. As a kiosk user, I want the forecast to refresh on its own and after a reconnect, so that the wall screen never shows yesterday's forecast.
46. As a household member, I want the forecast to keep showing the last good data if a refresh fails, so that a hiccup doesn't blank the card.
47. As the house owner, I want a Systems card with a status chip whose entity I choose in `home.json`, so that I can point it at a better internet sensor later without a code change.
48. As a household member, I want the gateway's uptime, the access points online, the last backup, and pending updates on the Systems card, so that I know the house's infrastructure is healthy.
49. As a household member, I want CPU usage bars for the gateway and access points, so that I can spot a struggling device.
50. As a household member, I want a Media card showing what's playing, where, and how loud, so that I know what's on around the house.
51. As a household member, I want the playing player listed first and the rest as small chips, so that the card stays short.
52. As a household member, I want a "N playing" chip on the Media card, so that I see activity at a glance.
53. As the house owner, I want each new card to appear only when its section exists in `home.json`, so that a house without weather or UniFi doesn't show empty cards.
54. As the house owner, I want a bad `home.json` section reported clearly, so that a typo doesn't silently hide a card.
55. As a household member, I want unavailable or missing entities shown as such on the new cards, so that the dashboard never guesses.
56. As someone trying the dashboard, I want `?demo` to show the new cards with placeholder data, so that I can see the whole design without a real house.

## Related Issues

none

## Discovery Notes

- The header today is `HouseSign` (`src/features/home/sign/`): a tall heartwood sign with a greeting, a house status sentence, the date and presence. It collapses into a sticky bar on scroll through an IntersectionObserver on the status line. `HouseSign.test.tsx`, `e2e/sign.spec.ts`, and the reading-order locator `.sign section, main section` in `e2e/home.spec.ts` and `e2e/smoke.spec.ts` depend on that structure, so the header rebuild rewrites them on purpose.
- Theme: `useThemePreference` (`src/app/theme/`) stores `'system' | 'light' | 'dark'` under `THEME_KEY`, sets `data-theme` on `<html>`, and updates the `theme-color` metas. It's held in `AppShell` and handed to `ThemeSection` in the settings sheet; the header toggle needs it lifted so both share it.
- Attention: `AttentionItem {id, tier, title, detail, action?}`, built by `leftOnRule`, `batteryRule`, `updateRule`, `thresholdRule` (toner, filter), and `ruleResult` (missing). There's no kind field; the kind only shows in the id prefix. `ConfirmButton` (`src/features/shared/`) has a 4 s window and 500 ms guard but doesn't disarm on outside taps. `SnoozeMenu` swaps the row's buttons for an inline group. With zero items the card shows "Nothing needs attention".
- Layout: media queries at 740 px (2 columns) and 1400 px (3 columns). Sections aren't boxed. `e2e/home.spec.ts` measures region positions at phone, 820×1180, 1180×820, and 1440 sizes.
- No icon library or icon component exists.
- Data: crypto's `statistics.ts` + `useHourlyMeans` is the template for connection access in a non-state hook. HA's `weather/subscribe_forecast` WebSocket subscription (what HA's frontend uses) pushes forecasts with no `call_service`, and `home-assistant-js-websocket` resubscribes it after a reconnect. The fake HA doesn't know that message yet.
- The `media_player` domain only models playback state. There are no `weather` or `sun` domains. `home.json` has no optional object sections yet; `parseHomeConfig`'s `optional()` helper supports adding them.
- Live house (checked through ha-mcp, not recorded in the repo): the weather entity supports hourly and daily forecasts; the gateway and access points have state, uptime (a boot timestamp), and CPU sensors; backup timestamps exist; about twenty `update.*` entities exist. No entity reports internet connectivity or WAN throughput, which is why the Systems chip is configurable.

Decisions from the interview:

- One plan: reskin first, then the three new cards in parallel.
- Icons come from `lucide-react`.
- The header is a slim sticky bar with no scroll-collapse; the house status sentence goes away.
- Snooze keeps the inline "1 day · 1 week · Cancel" choices behind a clock icon.
- Media is display-only; transport controls are a later plan.
- The Systems chip comes from a configurable entity and "up" state; the owner points it at the gateway state for now ("Gateway online").
- No bandwidth tile for now.
- The header toggle sets an explicit light or dark; System stays in settings.

Decisions after the post-plan review:

- Forecasts use the `weather/subscribe_forecast` subscription instead of polling `weather.get_forecasts`.
- An armed confirm also disarms when keyboard focus leaves it.
- Compact buttons apply app-wide.
- The wall tablet falls back to two columns when column 3 has no card.

## Scope

### In Scope

- Boxed card shell (icon label, status chip slot) and the 1/2/3-column grid with the approved card placement.
- Compact buttons (34 px visual) that keep 44 px touch targets.
- Slim sticky header bar: logo, name and greeting, presence, live clock and date, theme toggle, settings.
- Attention rows with item kinds, icon badges, icon action buttons, clock-icon snooze, the sliding two-tap confirm with outside-tap disarm, and a count chip.
- Hiding the attention card when empty, with the snoozed strip in its place.
- Favorites tile icons.
- Optional `weather`, `systems`, and `media` sections in `home.json`.
- Forecast subscription through `weather/subscribe_forecast`, and a fake HA that answers it and pushes updates.
- Today, Systems (including CPU bars), and Media cards.
- Demo-mode data for the new cards, and docs updates.

### Out of Scope

- Media transport controls (play/pause, skip, volume).
- Cameras.
- Bandwidth or WAN throughput tiles.
- Adding a Ping or WAN sensor in HA (an HA-side change).
- Climate and calendar cards.
- Editing the owner's real `home.json` (runtime file, not in the repo).
- Changing the token, auth, or reconnect behavior.

## Success Criteria

- [ ] The Home screen matches the approved mock-up at phone, tablet portrait, and wall-tablet sizes in light and dark.
- [ ] On a 1180×820 wall tablet the Home screen shows three equal, top-aligned columns.
- [ ] Attention actions still send through the service gateway, with confirm-required actions needing two taps.
- [ ] With nothing to attend to, the attention card is gone; with snoozes, the snoozed strip shows.
- [ ] Today, Systems, and Media render from live data when their sections exist, and are absent when they don't.
- [ ] `?demo` shows every card with placeholder data.
- [ ] All tests passing (`npm run format:check && npm run lint && npm test && npm run build`, plus `npm run test:e2e`)
- [ ] Code follows project standards

## Task Overview

| Task | Description                                         | Depends On              | Status  |
| ---- | --------------------------------------------------- | ----------------------- | ------- |
| 001  | Card shell, compact buttons, and the column grid    | -                       | completed |
| 002  | Slim sticky header bar with presence and clock      | 001                     | completed |
| 003  | Light/dark toggle in the header                     | 001, 002                | completed |
| 004  | Attention rows with kinds, icons, and icon actions  | 001, 009                | completed |
| 005  | Sliding two-tap confirm with outside-tap disarm     | 001, 004, 009           | completed |
| 006  | Hide the empty attention card; snoozed strip        | 001, 004, 009           | completed |
| 007  | Favorites tile icons                                | 001                     | completed |
| 008  | Forecast subscription and fake HA forecasts         | -                       | completed |
| 009  | `weather`, `systems`, `media` sections in home.json | -                       | completed |
| 010  | Today card                                          | 001, 008, 009           | completed |
| 011  | Systems card: status chip and stat tiles            | 001, 009                | completed |
| 012  | Systems card: CPU usage bars                        | 001, 009, 011           | completed |
| 013  | Media card (display-only)                           | 001, 009                | completed |
| 014  | Demo house and docs for the new cards               | 001, 008, 009, 010, 011, 012, 013 | completed |

## Architecture Notes

- **Layering stays one-way** (`app → features → domains → infrastructure`). New HA domains get folders: `src/domains/weather/` and `src/domains/sun/` (types, viewModel, factories), and `src/domains/media_player/` grows title, artist, artwork, and volume. The Systems card reads sensors through the existing `sensor` and `update` domains plus small pure view-model functions in its feature folder.
- **New features:** `src/features/home/today/`, `src/features/home/systems/`, `src/features/home/media/`, each a card component plus a pure view-model module, following `src/features/home/crypto/`.
- **Forecasts come from a subscription, not an HA action.** `src/infrastructure/ha/forecast.ts` subscribes with `conn.subscribeMessage` to `{type:'weather/subscribe_forecast', entity_id, forecast_type}`. Nothing calls a service, so the service gateway, principle 9, the `@live` read-only guard in `e2e/fixtures.ts`, and mocked specs' service-call assertions are all unaffected. The library resubscribes after a reconnect.
- **Mock-up:** `.farseer/plans/home-redesign/mockup.html` (static, placeholder data) is the visual reference for every task. Its media transport buttons and its green "sent" check on a confirmed action are not part of this plan.
- **Icons:** `lucide-react`, imported per icon by name (tree-shaken). Name-to-icon mappings return statically imported components from a `switch` or object literal; never `import { icons }`, `DynamicIcon`, or `import * as`, which pull all ~1,800 icons into the bundle. Lucide has no garage icon (004 lists the substitutes). Icons are decorative (`aria-hidden`); controls keep text accessible names.
- **Compact buttons:** the visual box shrinks to 34 px while a `::after` overlay extends the hit area to at least 44×44 px, which preserves the kiosk rule in `.farseer/architecture.md`. Compact sizing applies app-wide through the global button rule (owner's decision after review).
- **Grid:** columns are DOM wrappers (col 1: attention, suggestions, crypto; col 2: favorites, today; col 3: systems, media). Below 740 px the wrappers use `display: contents` and cards take an explicit `order` (001 defines the order classes for all seven slots), so the phone order differs from the column order. From 740 px: two columns, with col 3 spanning the full width below them as its own two-column grid (as in the mock-up's tablet view). From 1024 px: three equal columns when col 3 has a card, otherwise two. An empty col 3 never takes space.
- **Theme:** the header toggle uses the same `useThemePreference` state as `ThemeSection`. `AppShell` holds it (as today) and passes a `ThemeToggle` from `src/app/theme/` into `HomeScreen`'s `tools` slot (002), because the header is in `src/features/` and features don't import `src/app/`. No context in `src/app/`, and no second hook instance.
- **Config:** new sections are optional objects parsed with the existing `optional()`/`section()` helpers. A present-but-invalid section fails parsing with a path-specific message, like the other sections. `home.example.json` and `testHomeConfig.ts` gain all three sections. In `systems`, `uptime` has its own label and `accessPoints` its own up state, so repointing `status` at a Ping or WAN sensor doesn't change the other tiles.
- **Repo is public:** placeholder entity IDs only (`sensor.gateway_state`, `media_player.living_room_speaker`), no house names.

## Risks & Mitigations

- **Header rebuild breaks load-bearing selectors** (`.sign section`, sign collapse tests): 002 rewrites `sign.spec.ts`, `HouseSign.test.tsx`, and the reading-order locator together, and 001 drops People from the layout assertions so the two tasks don't fight.
- **Parallel tasks edit `src/index.css`** (one large file): each task keeps its styles in its own clearly headed block. 005 and 006 both follow 004 and touch different components.
- **Confirm changes touch a business-critical path** (actions that move the garage door): 005 keeps the guard window, the timeout, the disarm-on-disabled rule, and the send-time recheck in `AttentionAction`, and adds tests for each.
- **The forecast subscription's event shape can change between HA releases**: 008 checks it against the live instance first and parses defensively (a null or unknown shape keeps the last good forecast), and the Today card still shows current conditions without a forecast.
- **Uptime is a boot timestamp, not a duration**: the Systems view model computes days from the timestamp against the shared clock, and treats a future or unparseable timestamp as unknown.
- **The three-column breakpoint moves**: the wall tablet goes from 2 to 3 columns once column 3 has a card. 001 rewrites the layout spec at all four sizes in one place (with the two-column fallback), and 011 adds the three-column check.
- **Parallel tasks edit the same lines**: 010, 011, and 013 each add their card to the reading-order lists in `e2e/home.spec.ts` and `e2e/smoke.spec.ts` and to the phone-order spec, and 011 and 013 both insert into column 3 of `HomeScreen.tsx`. Expect small merges there. 004 now waits for 009 because both edit the config parser, its tests, `home.example.json`, and `testHomeConfig.ts`.
