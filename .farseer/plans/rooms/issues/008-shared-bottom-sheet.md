# Task 008: Shared Bottom Sheet

**Status**: completed
**Issue**: #52
**Depends on**: none
**Retry count**: 0

## Description

Move the generic modal bottom sheet out of `src/app/settings/` into `src/features/shared/` so features can open sheets (the room picker, the light detail sheet). `SettingsSheet` becomes a thin wrapper with its title. Behavior stays identical: rise and settle springs, drag to dismiss, focus trap, Escape, reduced motion.

## Context

- Related files: `src/app/settings/SettingsSheet.tsx` (+ `SettingsSheet.test.tsx`, `SettingsSheet.css`), new `src/features/shared/BottomSheet.tsx` (+ CSS), `src/app/AppShell.tsx`, `e2e/settings-sheet.spec.ts`.
- Imports flow `app → features`, so `features/` can't import from `app/settings/` today. The spring helpers (`SpringParams`, `SpringAnimation`) live in `src/app/motion/`; move what the sheet needs into `src/features/shared/` (or a shared motion module features can import) without leaving a copy behind.
- The sheet takes `open`, `onClose`, `title` (the accessible name, used for `aria-labelledby`), and `children`. Two sheets are never open at once, but nothing should assume a single global instance (no fixed `id`s; use `useId`; today's markup hard-codes `id="settings-title"`).
- **Render through a portal** (`createPortal(…, document.body)`). `SettingsSheet` sits outside `.content` in `AppShell`, but the room picker (010) and light sheet (015) open from inside Home. There, `.content[data-stale]` sets `opacity`, which creates a stacking context: the sheet would dim during a reconnect, and its `z-index: 20` would only count inside `.content`. Keep `data-testid="sheet-backdrop"` so `e2e/settings-sheet.spec.ts` still finds it.
- Existing settings-sheet tests move with the component; `SettingsSheet.test.tsx` keeps only what's specific to settings.

## Requirements (Test Descriptions)

- [x] `it opens a bottom sheet named by its title and closes it on Escape`
- [x] `it traps focus inside an open bottom sheet`
- [x] `it dismisses the bottom sheet on a downward flick of its header`
- [x] `it gives two bottom sheets distinct accessible names`
- [x] `it renders an open bottom sheet outside its parent's subtree, at the document body`
- [x] `it still opens settings from the header with the same sections`

## Acceptance Criteria

- All requirements have passing tests
- `e2e/settings-sheet.spec.ts` passes unchanged
- Code follows code standards
- No decrease in test coverage

## Implementation Notes
BottomSheet (portal, useId title) is in src/features/shared/BottomSheet.tsx/.css; spring.ts and its test moved to src/features/shared/. SettingsSheet is a thin wrapper; section styles stay in SettingsSheet.css. The last requirement is covered by existing AppShell.test.tsx settings tests (unchanged, passing).
