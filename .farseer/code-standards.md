# Code Standards

## Style Guide

TypeScript (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`) and React 19 function components. Formatting is Prettier: 2-space indent, single quotes, no semicolons, trailing commas, 100-column lines (`.prettierrc.json`). Markdown is not auto-formatted.

## Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npx oxlint --fix
```

oxlint runs the `react`, `typescript`, and `oxc` plugins (`.oxlintrc.json`). The hooks rule is off for `e2e/`, where Playwright's fixture `use()` isn't a React hook.

## Formatting

```bash
npm run format        # write
npm run format:check  # verify
```

## Type Checking

```bash
npm run build         # tsc -b, then vite build
npx tsc -p tsconfig.node.json --noEmit   # configs and e2e
```

## Pre-commit Checks

Run before every commit:

```bash
npm run format:check && npm run lint && npm test && npm run build
```

- All Vitest tests must pass.
- Run `npm run test:e2e` when the change touches a user workflow, layout, connection, or auth.
- Never commit secrets: `.env.local`, tokens, the HA-MCP URL path. Never put a long-lived token in source or the bundle.

## Naming Conventions

- Components: PascalCase, one per file, file named after it (`LightTile.tsx`).
- Hooks: `useX`, camelCase file (`useEntity.ts`).
- Functions and variables: camelCase. View-model builders are named for what they produce (`lightViewModel`, `toBrightnessPercent`).
- Types and interfaces: PascalCase (`LightViewModel`, `ServiceGateway`). Prefer `type` aliases; no `enum` (`erasableSyntaxOnly`), use string-literal unions.
- Constants: SCREAMING_SNAKE_CASE for module-level fixed values (`TOKENS_KEY`).
- Non-component modules: camelCase files (`viewModel.ts`, `storageKeys.ts`).
- HA identifiers keep HA's spelling: `entity_id`, domain names (`media_player`), attribute keys. Don't camelCase data that comes from HA; map it in the view model instead.

## React

- Function components and hooks only.
- Components take view models as props; they don't import infrastructure or reach into the entity store directly. Feature-level containers use selector hooks and pass view models down.
- No `useState`/`useReducer` copies of HA state (see `.farseer/architecture.md`).
- Accessibility is required, not optional: every control has an accessible name, real `<button>`s for actions, visible focus. Playwright selects by role and name.
- Touch targets at least 44×44 CSS px. No hover-only affordances.

## Comments

Explain why, not what: HA quirks, protocol behavior, and constraints a reader couldn't infer from the code (see `src/ha.ts` for the tone).
