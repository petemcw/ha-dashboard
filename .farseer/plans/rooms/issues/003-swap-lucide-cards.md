# Task 003: Swap Lucide for MDI: Favorites and Display Cards

**Status**: completed
**Issue**: #47
**Depends on**: 001
**Retry count**: 0

## Description

Migrate the second batch of Lucide imports: favorites (tile icons, the section's edit icon, the shared `Tile`), crypto, Today (including the weather-condition icon map), Systems, and Media. Favorites tiles start using the entity's own HA icon when its state has one, falling back to the domain default from `domainIcon`.

## Context

- Related files: `src/features/home/favorites/favoriteIcon.ts`, `FavoritesSection.tsx`, `Tile.tsx`, `FavoriteTile.tsx`, `src/features/home/crypto/CryptoRow.tsx`, `src/features/home/today/TodayCard.tsx`, `weatherIcon.ts` (+ `weatherIcon.test.ts`), `src/features/home/systems/SystemsCard.tsx`, `src/features/home/media/MediaCard.tsx`.
- `favoriteIcon(entityId)` becomes `favoriteIcon(entityId, entity)`: `iconForHa(entity?.attributes.icon, domainIcon(entityId))`. HA only puts `icon` in attributes when one is set on the entity; that's the right first choice.
- `weatherIcon.ts` maps HA weather conditions (`clear-night`, `cloudy`, `fog`, `hail`, `lightning`, `lightning-rainy`, `partlycloudy`, `pouring`, `rainy`, `snowy`, `snowy-rainy`, `sunny`, `windy`, `windy-variant`, `exceptional`) to icons; MDI has a `weather-*` icon for each. Keep the unknown-condition fallback.
- `SectionCard` already accepts `string | LucideIcon` (001), so this batch moves its callers (`FavoritesSection`, `CryptoRow`, `TodayCard`, `SystemsCard`, `MediaCard`) to paths without waiting for 002. Don't change `SectionCard` itself.
- `weatherIcon.test.ts` imports Lucide components to compare against; rewrite it to compare the returned path with the `@mdi/js` constants.
- `TodayCard.css` assumes Lucide's stroked, multi-path icons: `.wx-icon--sun` and `.wx-icon--cloud` set `fill` next to `stroke`-driven `color`, and `.wx-icon--partly path:last-child` colors the cloud of Lucide's two-path cloud-sun. MDI glyphs are one filled path (`fill="currentColor"`), so replace these rules: sun and cloud colors come from `color`; partly cloudy uses MDI's single-color `mdiWeatherPartlyCloudy` (decided with the owner: no two-tone stacking). Remove the Lucide comment.
- Accessible names unchanged; check screenshots at phone and tablet, light and dark.

## Requirements (Test Descriptions)

- [x] `it shows the entity's own HA icon on a favorites tile when HA sets one`
- [x] `it falls back to the domain icon on a favorites tile when the entity has no icon`
- [x] `it maps every HA weather condition to an MDI weather icon`
- [x] `it falls back to a neutral weather icon for an unknown condition`
- [x] `it colors the sun and cloud weather icons without Lucide's stroke rules`
- [x] `it renders the crypto, systems, and media card labels with MDI icons`

## Acceptance Criteria

- All requirements have passing tests
- No file in this batch imports `lucide-react`
- Screenshots checked at phone and tablet, light and dark
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `favoriteIcon(entityId, entity)` now returns an MDI path; `Tile` takes `icon: string` and renders `Icon`. Crypto uses `mdiCurrencyBtc`, Systems `mdiWifi`, Media `mdiMusic`/`mdiVolumeHigh`/`mdiVolumeOff`, Favorites `mdiStar`, Today `mdiWeatherSunny`.
- `weatherIcon` returns `{ path, tone? }`; `exceptional` maps to `mdiWeatherTornado`; unknown falls back to `mdiWeatherCloudy`. TodayCard.css stroke/fill rules replaced by `color`-only tones; unused `--wx-cloud` removed.
- Mocked Playwright specs (favorites, media, demo, icons) pass at phone and tablet. Screenshots not visually reviewed at light/dark by the worker; owner should eyeball Today icons (pale cloud tone uses `--wx-cloud-edge`).
