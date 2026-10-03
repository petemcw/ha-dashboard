# Task 002: App shell: tokens, connection banner, settings sheet

**Status**: complete
**Depends on**: 001
**Retry count**: 0

## Description

Build the shell around `HomeScreen`: a header with a Settings button, a connection banner that replaces the scaffold's status text, stale dimming of content while disconnected, neutral light/dark design tokens, and a settings sheet with theme override and sign out. Later tasks add the favorites editor and kiosk token sections to the sheet.

## Context

- Related files: `src/app/App.tsx`, `src/index.css`, `src/infrastructure/ha/connectionStatus.ts`, `src/infrastructure/ha/connection.ts` (`resetAuth`), `src/infrastructure/storageKeys.ts`
- New: `src/app/AppShell.tsx`, `src/app/ConnectionBanner.tsx`, `src/app/settings/SettingsSheet.tsx` (sections as children/slots so 004 and 012 add theirs in separate files), `src/app/theme/` (tokens CSS + `useThemePreference`).
- Tokens: CSS custom properties on `:root` for `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--accent`, `--warn`, `--danger`, `--stale-opacity`. Light values under `[data-theme="light"]` and `@media (prefers-color-scheme: light)` when no override; dark likewise. Neutral greys plus one blue accent; the palette is undecided.
- Theme preference: `system` | `light` | `dark`, stored per device under a new key in `storageKeys.ts` (`ha-dashboard:theme`), read/write wrapped in try/catch. `system` removes `data-theme`.
- Banner: shown for `reconnecting` ("Connection lost. Reconnecting…", `role="status"`), hidden for `connected`. While not connected, the main content gets a `data-stale` attribute (styled with reduced opacity) and `aria-busy="true"`.
- Sheet: a modal dialog (`<dialog>` or `role="dialog"` with focus trap), opened by a button named "Settings", closed by a button named "Close" and Escape. Touch targets ≥ 44 px.
- Sign out calls `resetAuth()`.
- `AppShell` passes its "open settings" callback to `HomeScreen`'s `onOpenSettings` prop (defined in 001), so the favorites prompt from task 011 can open the sheet without importing from `src/app/`.
- Update `e2e/smoke.spec.ts` reconnect test only if the banner text changes (keep the same text to avoid that).

## Requirements (Test Descriptions)

- [x] `it shows the reconnecting banner when the connection drops`
- [x] `it marks the home content stale while disconnected`
- [x] `it hides the banner and clears stale marking after reconnecting`
- [x] `it opens the settings sheet from the Settings button and closes it with Escape`
- [x] `it follows the system color scheme when the theme is set to System`
- [x] `it keeps a Dark theme override after a reload`
- [x] `it clears stored credentials when the user signs out`

## Acceptance Criteria

- All requirements have passing tests
- Every control has an accessible name and visible focus; no hover-only UI
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- New: `src/app/AppShell.tsx` (header, banner, stale wrapper `.content[data-stale]` + `aria-busy`, sheet), `ConnectionBanner.tsx` (also shows the error alert), `settings/{SettingsSheet,ThemeSection,SignOutSection}.tsx`, `theme/{tokens.css,useThemePreference.ts}`. `App.tsx` now only starts the session and renders `AppShell`.
- Sheet is a `role="dialog"` with focus trap, Escape, focus restore; sections are children so tasks 004/012 add theirs.
- Theme preference lives in `AppShell` (not the sheet): the first version held it in the sheet and a stored Dark override was not applied after reload while the sheet was closed. The test caught it.
- `THEME_KEY` added to `storageKeys.ts`. Banner text unchanged, so smoke e2e needs no edit.
- Tests written with code per slice. Sign-out test asserts stored keys are cleared (jsdom ignores `location.replace`).
