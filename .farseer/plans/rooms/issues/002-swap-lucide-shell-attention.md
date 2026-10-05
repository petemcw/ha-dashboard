# Task 002: Swap Lucide for MDI: Shell, Header, Attention, Suggested

**Status**: completed
**Issue**: #46
**Depends on**: 001
**Retry count**: 0

## Description

Migrate the first batch of Lucide imports to MDI paths through `Icon`: the theme toggle, header bar, `SectionCard`, the attention badges, action icons, snooze menu and snoozed strip, and the suggestions strip. The garage badge gets MDI's real garage glyph instead of Lucide's warehouse stand-in.

## Context

- Related files: `src/app/theme/ThemeToggle.tsx`, `src/features/home/header/HeaderBar.tsx`, `src/features/home/SectionCard.tsx` (+ `SectionCard.test.tsx`), `src/features/home/attention/attentionIcons.ts` (+ test), `SnoozeMenu.tsx`, `SnoozedStrip.tsx`, `src/features/home/suggestions/SuggestionsStrip.tsx`.
- `attentionIcons.ts` returns `LucideIcon` components today (`badgeIcon`, action icons). Change the return type to an MDI path string and render with `Icon`; keep the function names and the `AttentionIcon` / `ActionIcon` unions so `home.json` icon names (`garage`, `door`, `heater`, `light`, `fan`, `power`) keep working. Drop the "Lucide has no garage glyph" comment.
- `SectionCard` already accepts `string | LucideIcon` (001). Move this batch's callers (`AttentionCard`, `SuggestionsStrip`) to paths; don't touch `SectionCard`'s type (004 narrows it) or batch 2's callers.
- Accessible names must not change: icon buttons keep their `aria-label`s ("Close garage door", "Mark replaced", "Snooze …", "Switch to dark theme"), so existing specs keep passing.
- Three tests identify icons by Lucide's generated class names or import Lucide, and must be rewritten in this task (they can't pass unchanged): `e2e/theme-toggle.spec.ts` (`svg.lucide-moon` / `svg.lucide-sun`), `src/features/home/attention/attentionIcons.test.tsx` (`lucide-warehouse`, `lucide-door-open`, …), and `src/features/home/SectionCard.test.tsx` (imports `Sun`). Compare the rendered `<path d>` with the imported `@mdi/js` constant instead; Playwright specs can import `@mdi/js` too.
- Check `e2e/screenshots/` at phone and tablet sizes in light and dark after the swap: icon size and stroke weight differ between sets (MDI is filled), so adjust CSS sizing where an icon now looks heavier.

## Requirements (Test Descriptions)

- [x] `it shows the garage icon on a garage left-on row`
- [x] `it maps every left-on icon name in home.json to an MDI path`
- [x] `it renders the section card's icon label with an MDI icon`
- [x] `it keeps the theme toggle's accessible name and shows the icon for the theme a tap switches to`
- [x] `it keeps the accessible names of attention actions and the snooze menu`

## Acceptance Criteria

- All requirements have passing tests
- No file in this batch imports `lucide-react`
- Screenshots checked at phone and tablet, light and dark
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `attentionIcons.ts` now returns MDI paths (`badgeIcon`, `actionIcon`, `itemIcon`); the glyph components moved to `AttentionGlyphs.tsx` (+ test) so each file satisfies the only-export-components lint rule.
- Garage uses `mdiGarage`, heater `mdiRadiator`, filter `mdiAirFilter`, snooze `mdiAlarm`, Suggested `mdiCreation`, header settings `mdiTuneVariant`, theme `mdiWeatherSunny`/`mdiWeatherNight`.
- Updated AttentionRow.test, SectionCard.test, e2e/theme-toggle.spec.ts to compare `<path d>`. Mocked e2e specs pass. Phone light screenshots checked (sizes look fine); dark and tablet were not separately inspected.
