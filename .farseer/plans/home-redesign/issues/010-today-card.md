# Task 010: Today Card

**Status**: completed
**Depends on**: 001, 008, 009
**Retry count**: 0

## Description

Add the Today card under Favorites in column 2. It shows the current temperature and condition with an icon, today's high and low, humidity, wind, and UV, the next seven hours of forecast, and the sunset time in the header chip slot. It renders only when `home.json` has a `weather` section.

## Context

- Related files: new `src/domains/weather/` (`types.ts`, `viewModel.ts`, `factories.ts`), new `src/domains/sun/` (`types.ts`, `viewModel.ts`, `factories.ts`), new `src/features/home/today/` (card + pure view model), `src/infrastructure/ha/forecast.ts` (`useForecast`, from 008), `src/features/home/SectionCard.tsx`, `src/features/home/HomeScreen.tsx`, `src/infrastructure/clock/clock.ts`, `src/index.css`, and a new `e2e/today.spec.ts` seeded with `haOptions: { entities, forecasts }` (008's fake HA option).
- Weather view model: `status`, `condition` (HA's values such as `clear-night`, `cloudy`, `partlycloudy`, `rainy`, mapped to a label like "Partly cloudy" and a `lucide-react` icon), `temperature` with `temperature_unit`, `humidity` (%), `wind_speed` with `wind_speed_unit`, `uv_index`. Handle `unavailable`, `unknown`, and missing. A missing weather entity shows the card with "Missing" rather than hiding it.
- High and low: the first entry of the daily forecast (`temperature` / `templow`). Hourly: the next 7 entries from now, showing the hour ("Now", "8p", "9p"…), a small condition icon, and the temperature. Use two `useForecast` subscriptions (hourly and daily). Pick the daily entry whose date is today in local time; some integrations start the daily list at tomorrow late in the day, so with no entry for today, leave out high and low rather than showing tomorrow's.
- Sunset: `sun.sun`'s `next_setting`, formatted as local time ("Sunset 6:52 pm"). Omit it when the sun entity is missing.
- Without a forecast yet, or with an empty one, show current conditions and leave out the hourly row and high/low. Don't show a spinner.
- Card label "Today" with a sun icon. Sizes from the mock-up: the temperature in the slab face at about 3 rem, a 46 px condition icon, and a stats strip of three cells on a sunken background.
- Phone order is 4th (after favorites). Use the order class 001 already defined for the Today slot; don't edit the grid CSS.
- Condition icons follow the icon rule in `_plan.md`: import each lucide icon by name in one mapping function (no `icons` map, `DynamicIcon`, or namespace import).
- The shared test house gains a `weather` section in 009, so Today becomes a region in every mocked spec. Add "Today" to the reading-order lists in `e2e/home.spec.ts` (`SECTIONS`) and `e2e/smoke.spec.ts` (`order`), and to 001's phone-order spec (4th). 011 and 013 edit the same lines; expect a small merge.
- Forecasts arrive over `weather/subscribe_forecast`, not `call_service`, so existing service-call assertions in mocked specs are unaffected.

## Requirements (Test Descriptions)

- [x] `it maps a weather entity to its temperature, unit, condition label, and icon`
- [x] `it shows the current temperature and condition on the Today card`
- [x] `it shows today's high and low from the daily forecast`
- [x] `it shows humidity, wind, and UV from the weather entity`
- [x] `it shows the next seven hours from the hourly forecast`
- [x] `it shows the sunset time from the sun entity`
- [x] `it hides the Today card when home config has no weather section`

## Acceptance Criteria

- All requirements have passing tests, including a Playwright spec on the WebSocket mock
- `src/domains/weather` and `src/domains/sun` meet the 80% coverage gate
- Code follows code standards

## Implementation Notes

- `src/domains/weather/` (`types`, `viewModel` with `weatherViewModel` and `conditionInfo`, the one name-to-icon switch, `factories`) and `src/domains/sun/` (`sunViewModel` giving `nextSetting`), both 100% line coverage.
- `src/features/home/today/`: `todayViewModel.ts` (pure: today's daily entry by local date, next 7 hourly entries with "Now"/"7p" labels, "Sunset 6:52 pm"), `TodayCard.tsx` (presentational; Missing/Unavailable/Unknown shown in place of the body), `TodaySection.tsx` (container: two `useForecast` subscriptions, `useNow`, renders null without `weather` config).
- Wired into `HomeScreen` column 2 under Favorites with the existing `home__order--today` class; CSS in a headed "Today card" block at the end of `index.css`.
- Hourly entries whose hour already ended are skipped; the first is "Now" only when its hour has started.
- Added "Today" to `SECTIONS`, the DOM-order and phone-order specs in `e2e/home.spec.ts`, and `order` in `e2e/smoke.spec.ts`. New `e2e/today.spec.ts` (forecasts via fake HA option; no-forecast case).
- Unrelated failure seen: `home.spec.ts` wall-tablet test (Systems width differs from attention by about 85 px), in column 3 / Systems/Media work from other workers.
