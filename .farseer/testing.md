# Testing Configuration

TDD is the red → green loop. This is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle: consult them before and during the loop, not after.

When exploring the codebase, read `.farseer/domain.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## Test Framework

- **Vitest 5** (jsdom environment) for domain logic, view models, infrastructure, and React behavior.
- **React Testing Library** + `@testing-library/user-event` + `@testing-library/jest-dom` for components.
- **Playwright** (headless Chromium, `phone` and `tablet` viewports) for critical user workflows.

## TDD Methodology

Each issue follows strict Red → Green → Refactor:

1. Write ONE failing test for ONE requirement.
2. Write the MINIMUM but SUFFICIENT code to pass the current test.
3. Refactor the code while tests stay green.
4. Update the requirement as complete.
5. Repeat for the next requirement.
6. Commit when the issue is complete.

The TDD loop runs `npm test` (Vitest). Playwright is slower; run it at the end of an issue that touches a user workflow or layout.

### Good Tests

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe what the system does, not how it does it. A good test reads like a specification - "a light that is on shows its brightness as a percentage" tells you exactly what capability exists and it survives refactors because it doesn't care about internal structure.

### Bad Tests

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like reaching into the entity store instead of asserting what the user sees). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

### Anti-Patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel. The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does (`expect(toPercent(b)).toBe(Math.round(b / 255 * 100))`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead: one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## What gets which test

| Code                                         | Test                                   | Mock boundary                                                   |
| -------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| View models, domain logic (`domains/*/viewModel.ts`) | Vitest, plain function calls           | None. Inputs come from domain factories.                        |
| Domain actions (`domains/*/actions.ts`)      | Vitest                                 | Fake service gateway; assert the HA action and data it received |
| Entity store, selector hooks, gateway        | Vitest                                 | Fake `Connection` at the library boundary                       |
| Components and features                      | Testing Library                        | Fake store and gateway seeded with factories                    |
| Critical user workflows, layouts             | Playwright                             | HA WebSocket mock (`page.routeWebSocket`) seeded with factories |
| Auth and protocol against the real HA        | Playwright `@live`                     | None. Read-only.                                                |

Never mock our own modules (view models, actions, hooks). Mock only at the edges: the HA connection, the service gateway, the WebSocket.

## Safety: this is a real house

- `@live` tests must never call services. Anything that taps a control uses the WebSocket mock.
- `HA_TOKEN` reaches the test browser only through `e2e/fixtures.ts`. Never write it into source, snapshots, screenshots, or logs.

## Commands

```bash
# Run all unit and component tests (Vitest runs files in parallel by default)
npm test

# Watch mode while working
npm run test:watch

# Run specific test file
npm test -- src/domains/light/viewModel.test.ts

# Run with coverage
npm run test:coverage

# Playwright: all e2e tests (needs a direnv shell for HA_TOKEN)
npm run test:e2e

# Playwright: mocked tests only / live tests only
npm run test:e2e -- --grep-invert @live
npm run test:e2e -- --grep @live
```

## Parallel Execution

- **Default**: Always run tests in parallel unless debugging a specific failure.
- Parallel command: `npm test` (Vitest worker pool) and `npm run test:e2e` (Playwright `fullyParallel`).
- Sequential fallback: `npm test -- --no-file-parallelism`, `npm run test:e2e -- --workers=1`.

## Test File Locations

- Unit and component tests: colocated next to the source, `src/**/<name>.test.ts(x)`.
- Domain test factories: `src/domains/<ha-domain>/factories.ts`.
- Shared Vitest setup and helpers: `src/test/`.
- E2E tests: `e2e/*.spec.ts`; fixtures and the HA WebSocket mock in `e2e/` alongside them. Screenshots go to `e2e/screenshots/` (gitignored).

## Coverage Requirements

- Minimum: 80% (lines, functions, branches, statements) for `src/domains/**` and `src/infrastructure/**`, enforced by `vitest.config.ts`.
- Features and presentational components aren't gated on coverage; they're covered by behavior tests.
- New code must have tests.

## Test Naming Convention

- Test files: `<module>.test.ts` / `<Component>.test.tsx`, Playwright `<workflow>.spec.ts`.
- Structure: `describe('<unit or behavior>')` with `it('<does something observable>')`, written as a sentence in domain language: `it('shows unavailable when HA reports the light as unavailable')`.
- Tag Playwright tests that hit the real instance with `{ tag: '@live' }`.
