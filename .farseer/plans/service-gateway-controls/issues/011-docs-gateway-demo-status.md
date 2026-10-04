# Task 011: Docs: Gateway, Demo Mode, Status

**Status**: pending
**Issue**: #28
**Depends on**: 001, 002, 003, 004, 005, 006, 007, 008, 009, 010
**Retry count**: 0

## Description

Bring the project docs in line with what was built. Describe the gateway's location and its "never queue" rule, demo mode as the real gateway over one shared fake HA, the controls that now exist, and what stays display-only. Record the demo-mode design decision as an ADR, since it refines the glossary's "fake gateway for demo mode".

## Context

- Related files:
  - `CLAUDE.md` (Status section: controls are live, demo mode exists; Testing: `call_service` is now exercised against the mock, `@live` still blocks it)
  - `.farseer/architecture.md` (directory structure: `src/infrastructure/serviceGateway/`, `src/infrastructure/fakeHa/`, `src/app/demo/`; principles 9 and 18 as built)
  - `.farseer/domain.md` (glossary: Service gateway, Demo mode)
  - `.farseer/testing.md` (the "What gets which test" table: fake gateway, shared fake HA)
  - `docs/feature-decisions.md` (Release order: mark demo mode and home controls shipped)
  - New: `.farseer/adr/0001-demo-mode-shared-fake-ha.md` (use the `farseer:architecture-decision-records` format)
- Keep house-specific entity IDs and names out of everything written (public repo).

## Requirements (Test Descriptions)

- [ ] `architecture.md lists the serviceGateway, fakeHa, and app/demo locations`
- [ ] `domain.md defines demo mode as the real gateway over the shared fake HA`
- [ ] `an ADR records why demo mode uses one shared fake HA instead of a fake gateway`
- [ ] `CLAUDE.md status says which tiles and actions are live and which stay display-only`

## Acceptance Criteria

- Each requirement is checked by reading the updated file (docs task, no code tests)
- `npm run format:check` passes on the changed Markdown
- No entity IDs from the real house appear in any changed file

## Implementation Notes

(Left blank - filled in by programmer during implementation)
