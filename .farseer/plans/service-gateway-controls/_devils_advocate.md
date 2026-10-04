# Devil's Advocate Review: service-gateway-controls

Checked against the source on `feature/service-gateway-controls`, `home-assistant-js-websocket` 9.7.0 in `node_modules`, `.farseer/architecture.md`, `.farseer/code-standards.md`, and `.farseer/testing.md`.

## Critical (Must fix before building)

### C1. Demo mode can start a real connection, and possibly an OAuth redirect, before the demo module loads (task 009)

`getConnection()` lives in infrastructure, so it can't import the demo wiring in `src/app/demo/`, and the plan loads that wiring with a dynamic `import()`. `App` calls `startSession()` from a mount effect, and `startSession` calls `getConnection()`. If the demo chunk hasn't resolved by then, `getConnection()` runs the real `connect()`: it fetches `/config.json`, reads `LONG_LIVED_TOKEN_KEY`/`TOKENS_KEY`, and on a phone with no tokens `getAuth()` sends the browser to HA's login page. Nothing in task 009 says how the demo connection gets into `getConnection()` or when.

Fix: `connection.ts` exports an injection point (`installDemoConnection(connect)`). Once it's set, `getConnection()` uses it, and `resetConnection()` never clears it. `main.tsx` awaits the demo module and installs the connection before `createRoot().render()`. When `isDemoMode()` is true and nothing is installed, `getConnection()` rejects. It never falls back to the real `connect()`.

### C2. `PresenceRow` fetches `/config.json` in demo, and presence never shows (tasks 009, 010)

`PresenceRow` calls `useHaUrl()`, which calls `getConfig()` and fetches `/config.json`. The row also renders nothing until that resolves. So task 009's e2e check ("never fetched `/config.json`") fails, and story 29 (presence in demo) can't pass. Person pictures are resolved against `haUrl`, so a demo person with an `entity_picture` would also make a request to some origin.

Fix: in demo, `useHaUrl()` returns a placeholder (`location.origin`) without calling `getConfig()` (task 009). Demo `person` entities have no `entity_picture` (task 010).

### C3. The "`callService` only in the gateway" grep fails by design (tasks 001, 004–008, plan success criteria)

Task 001's acceptance criterion `grep -rn "callService" src/` → only `src/infrastructure/serviceGateway/` can't hold. Every domain action calls `gateway.callService(...)`, and `src/test/fakeServiceGateway.ts` implements `callService`. The first worker on task 004 will see a criterion from 001 that its own code breaks.

Fix: the rule becomes "only `src/infrastructure/serviceGateway/` imports `callService` from `home-assistant-js-websocket`, and no non-test file outside it sends a `call_service` message on a connection". Check it with a Vitest test that scans `src/` source files, not a raw grep.

### C4. No default for `useServiceGateway()`, and no test helper for "connected" (tasks 001, 004–008)

As soon as a tile or `ItemAction` calls `useServiceGateway()` and `useControlsEnabled()`, every existing test that renders them without a provider is affected: `HomeScreen.test.tsx`, `AppShell.test.tsx`, `FavoritesSection.test.tsx`, `AttentionSection.test.tsx`, `SuggestionsStrip.test.tsx`, `AttentionHarness`. If the hook throws without a provider, they all fail. `connectionStatus` is a module singleton that starts as `connecting`, so in Vitest every control is disabled unless a test sets it. Five parallel workers would each invent their own wrapper.

Fix (task 001):

- The context default is the module-level WebSocket gateway, so a missing provider keeps today's behavior.
- The provider value is that same stable singleton, which keeps memoized sections from re-rendering.
- Add shared helpers in `src/test/`: `renderWithHome(ui, { gateway })` mounts the provider, and `setConnected()` / `resetConnectionStatus()` handle the status store, with a reset in `afterEach`.

## Important (Should fix before building)

### I1. The demo socket contract is missing pieces `Connection` relies on (task 009)

The plan lists `send`, `close`, `add/removeEventListener`, `haVersion`. The library also uses:

- `readyState` and `OPEN`: `Connection.connected` is `socket.readyState == socket.OPEN`. If both are missing, `undefined == undefined` is true, so it works only by accident.
- `message` events whose `data` is a **JSON string**: `_handleMessage` calls `JSON.parse(event.data)`.
- A `close` event fired after `close()`: `_handleClose` drives reconnects.
- A `createSocket` that can be called again: the heartbeat's `conn.reconnect(true)` and any `close` call `options.createSocket` for a new socket. The core has to drop the old client's subscriptions.
- Replies delivered asynchronously (microtask or `setTimeout(0)`), not from inside `send()`. A synchronous reply re-enters `sendMessage`.

Add these to task 009 with a test: "it reconnects over a new demo socket after a forced reconnect and resumes `subscribe_entities`".

### I2. Task 009 can run in parallel with 001 but edits the same files and needs the gateway (tasks 001, 009)

Both tasks edit `src/app/App.tsx` and `AppShell.tsx`. Task 009's first requirement ("callService over the demo socket") is meant to show that the real gateway runs on the fake HA. If it imports `callService` from the library instead, it breaks C3. Fix: task 009 depends on 001 and runs that test through `createWebSocketGateway`.

### I3. Task 009 points at the wrong file for hiding settings

`SignOutSection` and `KioskTokenSection` are composed in `src/app/AppShell.tsx`, not in `SettingsSheet.tsx`, which only renders `children`. Hide them in `AppShell` (or inside each section).

### I4. Action targets can be missing or unavailable while the sensor is fine (tasks 002, 006, 007, 008, 010)

- `calmHouse()` seeds the left-on sensors but not `switch.garage_door_opener`, the scenes, or the reset scripts. The new fake answers `not_found` for those, so 006/007/008 specs and the demo house fail unless they seed the targets. Say so in each task.
- The real house doesn't need that `not_found`. As far as I know, HA logs a warning and acks a call that names a missing target entity, and it skips unavailable entities without an error (verify on the live instance with a read-only check; don't call the service). An offline opener relay would ack "Close garage door", nothing would happen, and no error would show. `useAttentionItems` only subscribes to the sensor (`rule.entity_id`), so the app can't see the opener's state today.

  Fix: task 007 subscribes to `rule.action.entity_id` as well and disables the action when that target isn't `ok`. Task 008 does the same for `resetScript`. This matches story 12 for tiles.

### I5. Components reading the entity store and gateway break code standards (tasks 004, 007)

`.farseer/code-standards.md` says that "Components take view models as props; they don't import infrastructure or reach into the entity store directly". Task 007 tells `ItemAction` to read `entityStore.get()`. Task 004 says to wire the gateway into `LightTile`/`SwitchTile`.

Fix: hooks live in containers. `FavoriteTile` and a new `AttentionAction` container call `useServiceGateway`/`useAction`/`useControlsEnabled` and pass `onPress`/`pending`/`failed`/`disabled` down. The send-time recheck reads through a new infrastructure function `readEntityNow(entityId)` in `src/infrastructure/entities/`, never `entityStore` from a component.

### I6. Task 004 has to fix the shared control contract that 005–008 build on

These would otherwise be invented two or three times:

- **Tile modes.** A toggle mode (`pressed: boolean` → `aria-pressed`) and a run mode (no `aria-pressed`) for script and scene tiles. Without that, 005 and 006 each add a "plain button" variant to `Tile.tsx`.
- **Accessible name.** The button's name is the entity's friendly name only (`aria-labelledby` the name span). The state text ("On, 50%") is its description. A toggle button's name shouldn't change when it's pressed, and Playwright selectors stay stable as `getByRole('button', { name: 'Kitchen' })`.
- **Inline error.** One shared `ActionError` component in `src/features/shared/` that always renders a `role="status"` region and fills it with "Didn't work, tap to retry". Tiles, suggestions, and attention actions all use it.

### I7. Tasks 005 and 006 run in parallel but edit the same files

Both edit `FavoriteTile.tsx` (adjacent `case` lines), `Tile.tsx`, `e2e/controls.spec.ts`, and `src/index.css`. Fix: 006 depends on 005, and 006's scene and suggestion specs go in their own `e2e/scene-controls.spec.ts`.

### I8. The demo house needs the new factories and visible effects (task 010)

- Task 010's fallback ("build fan/scene/script with `entityState()` and switch to the factories later") has no follow-up owner. Make 010 depend on 005 and 006.
- In demo, toggling `switch.garage_door_opener` doesn't change `binary_sensor.garage_door`, and `script.turn_on` changes nothing. "Close garage door" and "Mark replaced" would look broken, which fails story 28. Fix: the core gets an `onServiceCall` effects hook. The demo house uses it so the opener toggle closes the door sensor and the reset scripts move the filter's days remaining above the threshold, both after the delay. The demo house must also contain every action target (the opener, both scenes, both reset scripts).

### I9. The `ConfirmButton` contract is incomplete (tasks 003, 007, 008)

- The props list leaves out `pendingLabel`, which the description relies on ("Closing…", "Saving…").
- Nothing says who shows the failure. Decision: the caller renders `ActionError` next to the button, and `ConfirmButton` stays a button.
- A retry after a failure must still take two taps. The plan never says so, and a one-tap retry of a `toggle` is exactly the risk the confirm exists for.
- An accidental double tap (a bump, a toddler, a phone double-tap) produces two clicks about 100–300 ms apart. That arms and confirms in one gesture and defeats the confirm. Ignore confirming taps for about 500 ms after arming. Playwright specs then wait for the "Tap again to …" label before the second click.
- The revert timer is cleared on unmount.

### I10. The recheck semantics are unspecified for unavailable sensors (task 007)

"No longer reads `onState`" should cover `unavailable`, `unknown`, and missing: send nothing. The read happens inside the function passed to `useAction.run`, through `readEntityNow`, so it reflects the store at send time and not at render time.

### I11. The fake core's `call_service` details (task 002)

- Read targets from `target.entity_id` (a string or an array) and fall back to `service_data.entity_id`. The library always sends `target` and omits `service_data` when it's undefined.
- Broadcast the state change before the result, as HA usually does.
- Change `last_changed` only when the state actually changes.
- The core needs a `disconnect(client)` that `HaMock.drop()` and the demo socket's `close` call. A stalled client's send callback drops messages.

### I12. Existing tests that assert disabled controls need named owners (tasks 006, 007, 008)

These fail once the controls work. Task 002's "suite passes unchanged" may make a worker think they're off-limits:

- `e2e/suggestions.spec.ts:12-13` and `SuggestionsStrip.test.tsx:42-47` → task 006
- `e2e/attention.spec.ts:12-30`, `AttentionSection.test.tsx:43-48`, `leftOnRule.test.ts:39` → task 007
- `e2e/attention.spec.ts:79`, `AttentionSection.test.tsx:82-95`, `thresholdRule.test.ts:61-62` → task 008

### I13. The demo e2e can't see WebSockets through `request` events (task 009)

Playwright's `page.on('request')` doesn't report WebSocket connections. The "no request to the HA origin" check also needs `page.on('websocket')` to stay silent, and `mockHa.authTokens` and `mockHa.sent()` to stay empty. The auto `mockHa` fixture is installed anyway, so those are the clearest signals.

## Minor (Nice to address)

- **M1 (004).** Disabling the focused button while pending drops keyboard focus. Consider `aria-disabled` with the tap ignored.
- **M2 (003, 004).** Both may edit `src/index.css` in parallel. Expect small conflicts.
- **M3 (006, 008).** Remove the stale comment at `src/index.css:103` ("v1 shows most device actions disabled"), the unused `.suggestions-hint` styles, and the comment at `homeConfig.ts:19` ("Wired up by a later task").
- **M4 (002).** Make `failServices` changeable at runtime (`mockHa.failServices = [...]`) so an e2e spec can fail once and then retry.
- **M5 (006).** `StateTile` shows a scene's raw ISO timestamp today. Give the scene tile a fixed secondary text (for example "Scene").
- **M6 (009).** This is the largest task: socket, connection injection, App branch, `useHaUrl`, badge, settings, e2e. If it stalls, split it into infrastructure (socket and injection) and the app shell.
- **M7 (001).** The library rejects with a bare `3` when the socket is closed and with `{ type, success, error: { code: 3 } }` for in-flight calls on close. Don't branch on the rejection's shape, and don't log `data` or `target`.
- **M8 (003).** Fake timers with user-event need `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
- **M9 (002).** The fake's `not_found` for missing targets is stricter than real HA (see I4). That's useful for catching typos in tests, but it's a known difference worth a comment in the core.

## Questions for the Team

1. **The garage door after a successful toggle.** Pending ends on HA's ack, but the door takes 10–20 s to close, and the sensor reads open the whole time. The item and its "Close garage door" button come back right away. Someone who thinks it didn't work taps twice more and sends another `toggle`, which stops or reverses the door. The recheck doesn't help, because the sensor still reads open. Should a `toggle` action stay disabled ("Closing…") after a successful send until the sensor leaves `onState` or about 60 s pass? This adds to the settled "pending ends on ack" decision, so it needs your call. I recommend yes.
2. **A call in flight when the socket drops.** It counts as failed, but HA may have run it. Should that case say something like "Couldn't confirm. Check the device." instead of "Didn't work, tap to retry"?
3. **How long an error stays.** On a kiosk, "Didn't work, tap to retry" stays until the next tap, possibly for days. Should it clear after a while, or when the entity's state changes?
4. **A script that's already running.** Should its tile be disabled while HA reports it `on`, or can it be tapped again? A `single`-mode script ignores the second run, with a warning in HA's log.
5. **The fake's `not_found`.** Should the fake HA answer `not_found` for a missing target (stricter, catches typos), or ack like real HA does? See I4 and M9.
