# Task 004: Remove Lucide

**Status**: completed
**Issue**: #48
**Depends on**: 002, 003
**Retry count**: 0

## Description

The contract step: remove `lucide-react` from `package.json`, narrow `SectionCard`'s icon prop to an MDI path (dropping the `LucideIcon` branch 001 added), and add a guard test so Lucide and whole-module MDI imports can't come back. Record the outcome in `docs/feature-decisions.md` (the MDI open question is answered).

## Context

- Related files: `package.json`, `package-lock.json`, `src/features/home/SectionCard.tsx`, a new guard test next to the icons (pattern: `oneGateway.test.ts`, which scans source files for forbidden imports), `docs/feature-decisions.md` ("Visual style", "Open questions"), `.farseer/architecture.md` (mention `src/features/shared/icons/`), `.farseer/code-standards.md` if it mentions Lucide.
- Compare `npm run build` main-chunk size with `master` and note it in the PR; the curated map should cost tens of KB, not the whole set.

## Requirements (Test Descriptions)

- [x] `it finds no source file that imports lucide-react`
- [x] `it finds no source file that imports @mdi/js other than by name`
- [x] `it accepts only an MDI path as a section card icon`

## Acceptance Criteria

- All requirements have passing tests
- `lucide-react` is gone from `package.json` and the lockfile
- Docs updated
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- Guard tests in `src/features/shared/icons/iconImports.test.ts`; `SectionCard` icon is `string` only. `lucide-react` removed from package.json and lockfile; oxlint restricted-imports now bans the `@mdi/js` default import. Docs (feature-decisions, architecture) updated. Main chunk: 378.5 kB (125 kB gzip); master comparison not run.
- Visual check not done (no layout change in this task).
