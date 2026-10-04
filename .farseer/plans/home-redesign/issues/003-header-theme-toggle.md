# Task 003: Light/Dark Toggle in the Header

**Status**: completed
**Depends on**: 001, 002
**Retry count**: 0

## Description

Add a sun/moon icon button next to Settings in the header bar that flips between light and dark in one tap. It sets an explicit preference through the same state the settings sheet uses, so the sheet's System/Light/Dark radios always agree with it. System stays available only in settings.

## Context

- Related files: `src/app/theme/useThemePreference.ts`, `src/app/settings/ThemeSection.tsx` (or wherever `ThemeSection` lives), `src/app/AppShell.tsx` (holds the preference today), the header-bar component from 002, `src/infrastructure/storageKeys.ts` (`THEME_KEY`), `src/app/AppShell.test.tsx`, `e2e/settings-sheet.spec.ts`.
- One source for the header and the sheet: `AppShell` already holds `useThemePreference()`. Build a `ThemeToggle` component in `src/app/theme/` that takes `preference` and `onChange`, and have `AppShell` pass `<ThemeToggle preference={theme} onChange={setTheme} />` into `HomeScreen`'s `tools` slot (added by 002), which renders it beside Settings. Don't use a context in `src/app/theme/` read from the header: `HeaderBar` lives in `src/features/home/`, and features don't import `src/app/` (imports go one way, `app → features → domains → infrastructure`). Don't create a second hook instance with its own copy.
- The "effective" theme is the explicit preference, or the OS setting (`matchMedia('(prefers-color-scheme: dark)')`) when the preference is `system`. The toggle shows a moon while the effective theme is light and a sun while it's dark, and listens for OS changes while on `system`.
- jsdom has no `window.matchMedia`, and `src/test/setup.ts` doesn't stub it. Guard the call like `SettingsSheet.tsx` does (`window.matchMedia?.(…)`; no `matchMedia` means light), or every test that renders `AppShell` (`AppShell.test.tsx`, `App.*.test.tsx`) crashes. Test the `system` case either in Playwright with `page.emulateMedia({ colorScheme: 'dark' })` or with a `matchMedia` stub local to that test, not a global one.
- Accessible name: "Switch to dark mode" or "Switch to light mode". Icons are `lucide-react`, decorative.
- Writing the preference keeps existing behavior: `data-theme` on `<html>`, `theme-color` metas, localStorage.

## Requirements (Test Descriptions)

- [x] `it switches to dark mode when the header toggle is tapped in light mode`
- [x] `it switches to light mode when the header toggle is tapped in dark mode`
- [x] `it switches to the opposite of the device theme when the preference is system`
- [x] `it names the toggle for the theme a tap will switch to`
- [x] `it shows the theme chosen in the header as selected in the settings sheet`
- [x] `it remembers the theme chosen in the header after a reload`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `src/app/theme/ThemeToggle.tsx`: moon/sun icon button named "Switch to dark mode" / "Switch to light mode". `AppShell` passes it into `HomeScreen`'s `tools` slot from the same `useThemePreference` instance the settings sheet uses.
- Effective theme is the explicit preference, or a guarded `window.matchMedia?.(...)` with an OS-change listener while on `system` (no `matchMedia` means light).
- The six requirements are tested in `src/app/AppShell.test.tsx`; the `system` case uses a `matchMedia` stub local to that test. No Playwright spec for the toggle.
- No new CSS; reuses `.icon-button`. `CLAUDE.md` Status mentions the header bar and toggle.
- Worker wrote tests alongside the implementation rather than strictly red-first (reported by the worker). Orchestrator filled in this file after verifying the tests pass.
