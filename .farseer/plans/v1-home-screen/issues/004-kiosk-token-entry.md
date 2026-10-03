# Task 004: Kiosk token entry

**Status**: completed
**Depends on**: 001, 002, 003
**Retry count**: 0

## Description

Let a fresh wall tablet be set up without anyone logging in on it. Opening `/?kiosk` with no stored credentials shows a "paste long-lived token" form instead of redirecting to HA's OAuth login. The settings sheet gets a section to replace the token. This is auth code, a business-critical path: the token must never reach logs, error text, the URL, or the bundle.

## Context

- Related files: `src/infrastructure/ha/connection.ts` (`loadLongLivedToken`, `oauth`, `connect`, `resetAuth`), `src/infrastructure/storageKeys.ts` (`LONG_LIVED_TOKEN_KEY`, `TOKENS_KEY`), `src/app/App.tsx`, `src/app/settings/SettingsSheet.tsx`
- New: `src/app/kiosk/KioskTokenForm.tsx`, `src/app/settings/KioskTokenSection.tsx`.
- Flow: before `getConnection()` starts OAuth, check for the `kiosk` query param and the absence of both stored OAuth tokens and a long-lived token. If so, render the form instead of connecting. On submit, store the token under `LONG_LIVED_TOKEN_KEY`, remove the `kiosk` param with `history.replaceState`, and connect.
- A rejected token (`ERR_INVALID_AUTH`) clears it and returns to the form with an error ("Home Assistant rejected that token."), not to OAuth, while the `kiosk` intent is remembered for this page load.
- Input: `type="password"`, `autocomplete="off"`, label "Long-lived access token". Never echo the value; never include it in error messages or `console` output.
- Settings section "Kiosk token": a password field and "Save token" button; saving replaces the stored token, clears OAuth tokens, and reconnects (a reload is acceptable).
- Remember `getConnection()` caches one promise per page load (StrictMode double-run); the form path must not start OAuth first.
- **Conflicts with today's `connect()`, which this task must change:**
  - `connect()` calls `resetAuth()` on `ERR_INVALID_AUTH`. That runs `location.replace(location.pathname)`, which drops `?kiosk` and sends the tablet to OAuth. On the kiosk path, handle the rejection without `resetAuth()`: remove only `LONG_LIVED_TOKEN_KEY` and return to the form.
  - `getConnection()` caches the rejected promise in `pending`, so a second token attempt on the same page load would get the same rejection. Add a way to clear it (e.g. `resetConnection()`) so the next submit opens a new connection, and make sure the entity store and connection status store from 001 attach to that new connection.
  - The non-kiosk paths keep calling `resetAuth()` exactly as before.
- **Kiosk mode sticks to the device** (owner decision): saving a token through the form sets a per-device flag in `storageKeys.ts` (`ha-dashboard:kiosk-mode`, try/catch like the other keys). While the flag is set, a missing or rejected token, and `reconnect-error`, return to the token form instead of `resetAuth()` and the OAuth login. Sign out on a kiosk clears the token and the flag.
- The settings sheet's "Kiosk token" section only renders when the device is in kiosk mode (flag set). Phones on OAuth don't see it.
- The kiosk's token is meant to belong to a dedicated **non-admin** HA user (owner decision), so the kiosk has its own favorites and sees snoozes without setting them. Nothing in the app depends on which user it is.
- e2e (`e2e/kiosk.spec.ts`): use the mock fixture from task 003 with `seedToken: false`, open `/?kiosk`, submit a token, assert the mock received `auth` with it and the home screen renders.

## Requirements (Test Descriptions)

- [x] `it shows the token form for ?kiosk when no credentials are stored`
- [x] `it does not redirect to the Home Assistant login when ?kiosk is set`
- [x] `it stores the pasted token and connects with it`
- [x] `it removes the kiosk parameter from the URL after saving`
- [x] `it clears a rejected token and shows the form again with an error`
- [x] `it connects with a second token after the first was rejected, without a reload`
- [x] `it never includes the token in error text`
- [x] `it replaces the stored token from the settings sheet`
- [x] `it returns a kiosk device to the token form, not the Home Assistant login, when its token is rejected later`

## Acceptance Criteria

- All requirements have passing tests (Vitest for the flow, one Playwright mock spec for the end-to-end path)
- Without `?kiosk`, the existing OAuth and long-lived-token paths behave exactly as before
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `connection.ts`: `?kiosk` with no stored credentials throws `ERR_KIOSK_TOKEN_REQUIRED` instead of starting OAuth; on a kiosk device a rejected token clears credentials without `resetAuth()`. New exports: `saveKioskToken`, `resetConnection`, `isKioskDevice`, `isKioskMode`, `forgetCredentials`. `resetAuth()` also clears the kiosk flag.
- `session.ts` sets `connecting` at start and `needs-token` (new `connectionStatus` kind) for a missing or rejected token, or `reconnect-error` on a kiosk. Rejection text is fixed: "Home Assistant rejected that token."
- `storageKeys.ts`: `KIOSK_MODE_KEY` (`ha-dashboard:kiosk-mode`), so a kiosk device stays on the token form after a later rejection.
- UI: `src/app/kiosk/KioskTokenForm.tsx` (password input, cleared after submit), `src/app/settings/KioskTokenSection.tsx` (only on kiosk devices). `App.tsx` shows the form on `needs-token`; submit saves the token and restarts the session without a reload.
- `e2e/haMock.ts` (additive): `authTokens` and a `rejectTokens` option answering `auth_invalid`.
- Tests: `src/app/App.kiosk.test.tsx` (all requirements), `connection.test.ts`, `session.test.tsx`, `e2e/kiosk.spec.ts`.
- Known limit: after a token change, the previous token's entities stay in the store until the new connection's first snapshot.
- Requirement boxes and these notes were filled in by the orchestrator from the worker's report after confirming the tests exist and pass.
