# Task 001: Service Gateway and Action State

**Status**: pending
**Issue**: #18
**Depends on**: none
**Retry count**: 0

## Description

Build the service gateway: the only code in the app that sends HA actions. It has a WebSocket implementation that refuses to send unless the connection is `connected`, a React provider, a fake for Vitest, a `useControlsEnabled()` hook, and a generic `useAction` hook that holds a control's pending and failed state. Every later control task builds on this.

## Context

- Related files:
  - New: `src/infrastructure/serviceGateway/serviceGateway.ts`, `ServiceGatewayProvider.tsx` (+ context and `useServiceGateway`), `useAction.ts`, `useControlsEnabled.ts`; `src/test/fakeServiceGateway.ts`
  - Modify: `src/test/fakeConnection.ts` (add `sendMessagePromise` that records messages and resolves or rejects on the test's command), `src/app/App.tsx` (mount the provider with the WebSocket gateway), `src/test/renderWithHome.tsx` (optional `gateway`)
  - New (tests): `src/test/connectionStatus.ts` (`setConnected`, `resetConnectionStatus`), `src/infrastructure/serviceGateway/oneGateway.test.ts` (source scan)
  - Reference: `src/infrastructure/appData/useAppDataWriter.ts` (the `inFlight` ref plus `pending`/`failed` pattern to copy), `src/infrastructure/ha/connectionStatus.ts`, `src/infrastructure/ha/connection.ts` (`getConnection`)
- Patterns to follow: infrastructure functions take `connect = getConnection` as an injectable default (see `appData.ts`). Test the WebSocket gateway over `createFakeConnection()`, not by mocking `callService`.
- `home-assistant-js-websocket` 9.7.0 `callService(conn, domain, service, serviceData?, target?)` → `sendMessagePromise({ type: 'call_service', domain, service, service_data, target })`. While disconnected it rejects with `ERR_CONNECTION_LOST`; after a suspend/resume it **queues**, which is why the gateway checks status itself.
- Architecture principle 9: the gateway is the only caller of `callService`. Principle 10: pending lives in the action's state, never as an optimistic copy of the entity.
- **Provider default and stability (review C4).** The context's default value is the module-level WebSocket gateway (`webSocketGateway = createWebSocketGateway()`), so components rendered without a provider (existing `HomeScreen`, `AppShell`, `FavoritesSection`, `AttentionSection`, `SuggestionsStrip` tests, `AttentionHarness`) keep working. The provider in `App.tsx` passes that same singleton, never a gateway built during render, so memoized sections don't re-render when `App` does. Mount it in `App.tsx` around `HomeConfigGate` (task 009 also edits `App.tsx` and depends on this task).
- **Shared test helpers (review C4).** Tasks 004–008 all need these; build them here so parallel workers don't invent their own:
  - `renderWithHome(ui, { config?, gateway? })` in `src/test/renderWithHome.tsx` also mounts `ServiceGatewayProvider` when `gateway` is given.
  - `setConnected()` / `resetConnectionStatus()` in `src/test/` set `connectionStatus` to `connected` / back to its initial value. `connectionStatus` is a module singleton that starts as `connecting`, so every control is disabled in Vitest until a test sets it. Tests reset it in `afterEach`.
- **Two kinds of failure (user decision, after review).** A call in flight when the socket drops may or may not have run in HA, so the UI words it differently from a call HA rejected. The gateway is the one place that knows the library's error shapes, so it normalizes every rejection into a `ServiceCallError` with `kind`:
  - `'connection-lost'`: the library rejected with a bare `3` (`ERR_CONNECTION_LOST`), or with `{ type: 'result', success: false, error: { code: 3, … } }` for a call in flight when the socket closed. The outcome is unknown.
  - `'rejected'`: HA answered with an error result (any other code), or the gateway refused to send because the status wasn't `connected`. Nothing ran.
  - Nothing outside the gateway branches on library error shapes. Never log `data` or `target`.
- **When a failure clears (user decision, after review).** On a kiosk, an error could otherwise sit on the wall for days. `useAction` clears `failure` when the next run starts, 60 s after the failure, or when the caller's `clearKey` changes. The caller passes something derived from the target entity's view model (for example its state text), so HA reporting a change clears the error. Use fake timers in the tests.
- **One-gateway rule (review C3).** Domain actions call `gateway.callService(...)` and the fake gateway implements `callService`, so a plain grep for `callService` can't be the check. The rule: only `src/infrastructure/serviceGateway/` imports `callService` from `home-assistant-js-websocket`. Enforce it with a Vitest test that reads every non-test `.ts`/`.tsx` file under `src/` and fails if any other file imports `callService` from the library.

## Requirements (Test Descriptions)

- [ ] `it sends call_service with the domain, service, data, and target through the connection`
- [ ] `it rejects without sending anything when the connection status is not connected`
- [ ] `it rejects when HA answers the call with an error`
- [ ] `useControlsEnabled is true only while the connection status is connected`
- [ ] `useAction is pending from run until the action settles`
- [ ] `useAction ignores a second run while the first is still in flight`
- [ ] `useAction marks failed when the action rejects and clears it on the next run`
- [ ] `it rejects with a connection-lost error when the socket closes while the call is in flight`
- [ ] `it rejects with a rejected error when HA answers with an error result`
- [ ] `useAction clears the failure sixty seconds after it happened`
- [ ] `useAction clears the failure when the clear key changes`
- [ ] `useServiceGateway returns the WebSocket gateway when no provider is mounted`
- [ ] `no module outside the service gateway imports callService from home-assistant-js-websocket`

## Acceptance Criteria

- All requirements have passing tests
- Only `src/infrastructure/serviceGateway/` imports `callService` from `home-assistant-js-websocket` (checked by the source-scan test above)
- The provider is mounted for the whole app with a stable gateway value; components get the gateway through `useServiceGateway()`
- `renderWithHome` accepts a `gateway`, and `setConnected()` / `resetConnectionStatus()` exist in `src/test/`
- Existing component tests pass without changes
- The fake gateway records `{domain, service, data, target}` per call and lets a test resolve or reject each call
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)

Shape from planning:

```ts
export type ServiceTarget = { entity_id: string | string[] }
export type ServiceGateway = {
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: ServiceTarget,
  ): Promise<void>
}

// Rejections from callService. connection-lost: the outcome is unknown.
export class ServiceCallError extends Error {
  constructor(readonly kind: 'connection-lost' | 'rejected') { super(kind) }
}

export type ActionState = {
  pending: boolean
  // Why the last run failed. Cleared on the next run, after 60 s, or when clearKey changes.
  // A non-ServiceCallError rejection counts as 'rejected'.
  failure: 'connection-lost' | 'rejected' | null
  run: (action: () => Promise<unknown>) => void
}

export function useAction(options?: { clearKey?: unknown }): ActionState
```
