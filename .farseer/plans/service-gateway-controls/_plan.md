# Plan: Service Gateway and First Controls

## Created

2026-10-03

## Status

ready

## Objective

Add the service gateway, the single seam that sends HA actions, and use it to turn the v1 home screen's disabled controls into working ones: favorites tiles, attention actions, and suggestion buttons. Ship `?demo` mode at the same time, so the controls can be tried on a real phone without touching the house.

## User Stories

1. As a household member, I want to tap a light tile in my favorites to turn it on or off, so that I don't have to open the HA app for everyday lights.
2. As a household member, I want to tap a switch tile to turn it on or off, so that plugs like the Christmas tree or space heater are one tap away.
3. As a household member, I want to tap a fan tile to turn it on or off, so that the fan is as easy to control as the lights.
4. As a household member, I want to tap a scene tile to activate it, so that I can set a mood from my favorites.
5. As a household member, I want to tap a script tile to run it, so that routines I've built in HA are reachable from the dashboard.
6. As a household member, I want a tile to say what it will do (on or off) and expose that state to screen readers, so that I know the result of a tap before I make it.
7. As a household member, I want a tile to show that my tap is being sent, so that I don't tap again and send it twice.
8. As a household member, I want a tile to show only what HA reports after a tap, so that the dashboard never claims a light is on when it isn't.
9. As a household member, I want a failed tap to say "Didn't work, tap to retry" on the control itself, so that I know the house didn't change and can try again.
   - As a household member, I want a tap cut off by a dropped connection to say "Connection dropped, check before retrying", so that I don't blindly repeat something that may already have happened.
   - As a kiosk user, I want an inline error to clear after a minute or once HA reports the device changed, so that a stale error doesn't sit on the wall for days.
10. As a screen reader user, I want a failed action announced, so that I learn about the failure without looking for it.
11. As a household member, I want controls disabled while the dashboard is disconnected or reconnecting, so that a tap can't get queued and fire minutes later.
12. As a household member, I want tiles for unavailable or missing entities to be disabled, so that I'm not tapping something HA can't reach.
13. As a household member, I want media, cover, climate, and lock tiles to stay display-only for now, so that riskier controls get their own design later.
14. As a household member, I want "Turn off" on a left-on attention item to turn off the space heater or lightstrip, so that I can deal with it from the alert.
15. As a household member, I want closing the garage door from its attention item to need a second tap, so that a stray tap can't move the door.
16. As a household member, I want the garage toggle skipped if the door sensor no longer reads open at the moment I confirm, so that a stale screen can never reopen a door that already closed.
17. As a household member, I want any left-on action skipped when its sensor already reads off, so that an action never runs against a state I can't see.
18. As a household member, I want the armed confirm button to go back to normal after about four seconds, so that a forgotten first tap doesn't leave a loaded button on the wall screen.
19. As a household member, I want "Mark replaced" on a filter chore to run its reset script after a second tap, so that I can record a filter change without resetting it by accident.
20. As a household member, I want an attention item to disappear once HA reports the problem fixed, so that the list reflects the house and not my taps.
21. As a household member, I want to tap a suggestion to run its scene, with the configured transition, so that "Media viewing mood" works from the strip.
22. As a household member, I want a failed suggestion to show the same inline error as other controls, so that failures look the same everywhere.
23. As a kiosk user, I want controls to work with the kiosk token the same as with an OAuth login, so that the wall tablet is just as useful.
24. As the owner, I want every HA action to go through one gateway, so that there is exactly one place that can change the house.
25. As the owner, I want a light or switch tap to send an explicit `turn_on` or `turn_off` based on what the tile showed, so that a stale screen can't flip a device the wrong way.
26. As the owner, I want to open the dashboard with `?demo` and get a placeholder house with no login, so that I can try controls on my phone without touching the real house.
27. As the owner, I want demo mode to show a visible Demo badge, so that I never mistake it for the real house.
28. As the owner, I want taps in demo mode to change the demo house after a short delay, so that I can see the pending state and the result.
29. As the owner, I want demo mode to show attention items, suggestions, favorites, presence, and crypto, so that every section can be tried.
30. As the owner, I want demo mode to never contact my HA, never read `home.json`, and never touch my stored tokens, so that sharing a `?demo` link reveals nothing about my house.
31. As the owner, I want sign-out and kiosk token settings hidden in demo mode, so that demo can't log out or change the real device setup.
32. As the owner, I want demo mode to last only while `?demo` is in the URL, so that a device never gets stuck in demo.
33. As a developer, I want one fake HA used by the Playwright mock and by demo mode, so that tests and demo can't drift into two different fakes.
34. As a developer, I want the fake HA to answer `call_service` by recording the call and updating entity state, so that e2e specs can check both the message and the screen.
35. As a developer, I want the fake HA to fail chosen HA actions on request, so that error states can be tested end to end.
36. As a developer, I want a fake service gateway for Vitest that records calls and lets the test resolve or reject them, so that pending and error states are easy to test.
37. As a developer, I want factories for fan, scene, and script entities, so that the new controls are tested with the same data as everything else.
38. As a developer, I want `@live` specs to keep blocking every `call_service`, so that no test run can change the real house.
39. As a developer, I want the architecture and domain docs updated to describe the gateway and demo mode as built, so that the next feature starts from accurate docs.

## Related Issues

- Task 001: #18
- Task 002: #19
- Task 003: #20
- Task 004: #21
- Task 005: #22
- Task 006: #23
- Task 007: #24
- Task 008: #25
- Task 009: #26
- Task 010: #27
- Task 011: #28

## Discovery Notes

- Nothing in `src/` calls `callService` yet. The only HA writes are app-data writes through `useAppDataWriter` (`src/infrastructure/appData/`), whose pattern (an `inFlight` ref, `pending` and `failed` state, nothing applied locally) is the model for a domain action's pending state.
- Disabled placeholders already exist: `Tile` (`src/features/home/favorites/Tile.tsx`) is a non-interactive `<li>`; `ItemAction` renders a disabled button for left-on and filter items (`AttentionItem.action` is `{ label, enabled: false } | { label, href }`); `SuggestionsStrip` renders disabled buttons with a hint.
- Config already carries the actions: `LeftOnRule.action: HaAction` (`{domain, service, entity_id}`), `FilterRule.resetScript`, `suggestions.playing.transition`.
- No `domains/*/actions.ts` exist. There are factories for light, switch, binary_sensor, media_player, sensor, person, and update. Fan, scene, and script have no factories or view models; `FavoriteTile` sends them to `StateTile`.
- `home-assistant-js-websocket` 9.7.0: while disconnected, `sendMessagePromise` rejects with `ERR_CONNECTION_LOST`. Commands in flight when the socket closes are rejected with the same error. After a suspend/resume, the library queues messages and sends them later. That is the reason the gateway refuses to send unless the connection status is `connected`.
- Every HA access goes through `getConnection()` (`src/infrastructure/ha/connection.ts`), and `startSession(connect)` takes a connect function. Demo mode can swap the connection without touching features.
- `e2e/haMock.ts` (`HaMock`) speaks the real wire protocol and holds entities, user/system data, and statistics. It answers `call_service` with `unknown_command` today. `src/test/fakeConnection.ts` is the Vitest fake `Connection`.
- `e2e/fixtures.ts`'s `liveTest` guard already blocks `call_service` and `frontend/set_*` from reaching the real HA.
- Decided in the interview: all three surfaces get controls; light, switch, and fan tiles toggle and scene and script tiles run, while media, cover, climate, and lock stay display-only; tapping a light only toggles it (no brightness drag); pending ends when HA acknowledges the call; controls are disabled unless connected; failures show inline on the control; the garage door and "Mark replaced" use a tap-twice confirm that reverts after about 4 s; the garage toggle is skipped if its sensor no longer reads open; `?demo` uses the factory house, works for anyone on the deployed build with a Demo badge, reacts to taps, and is built on one fake HA shared with Playwright.
- Assumptions accepted with the summary: any left-on action whose HA action is `toggle` gets confirm plus recheck, and every left-on action rechecks its sensor; scripts run through `script.turn_on`; a call in flight when the socket drops counts as failed.

## Scope

### In Scope

- `ServiceGateway` in `src/infrastructure/serviceGateway/`: the WebSocket implementation, a refusal unless connected, a React provider, and a fake gateway for Vitest.
- A generic action-state hook (pending, failed, run, never two at once) used by every control.
- Domain actions: on/off for light, switch, and fan; `activateScene` (with optional transition); `runScript`; a generic configured HA action for left-on rules.
- Fan, scene, and script factories and view models.
- Tappable favorites tiles for light, switch, fan, scene, and script, with `aria-pressed`, pending, and inline error states, disabled when offline, pending, unavailable, or missing.
- A shared two-tap `ConfirmButton`.
- Attention actions: left-on (recheck, plus confirm for `toggle`) and filter "Mark replaced" (confirm, runs the reset script).
- Suggestion buttons that run their scene.
- A shared fake HA core extracted from `HaMock`, plus `call_service` support and failure injection.
- `?demo` mode: an in-browser connection over the fake HA, the placeholder config, a demo house seed, a short response delay, a Demo badge, and auth-related settings hidden.
- Doc updates (architecture, domain glossary, CLAUDE.md status, feature decisions).

### Out of Scope

- Brightness drag, color/temperature, and the light detail sheet.
- Media transport, cover, climate, lock, and fan speed controls.
- Room/area views.
- Optimistic UI, or waiting for a state change after HA acknowledges.
- Any change to HA itself (helpers, scripts, automation).
- A per-rule `confirm` field in `home.json`.
- Haptics and sounds.

## Success Criteria

- [ ] Only `src/infrastructure/serviceGateway/` imports `callService` from `home-assistant-js-websocket`, checked by a Vitest source scan. (A plain grep for `callService` can't be the check: domain actions call `gateway.callService`.)
- [ ] Light, switch, fan, scene, and script favorites send the right HA action in Playwright mock specs at both viewports.
- [ ] Garage door and "Mark replaced" send nothing on the first tap and send on the second; the garage door sends nothing when the sensor has closed.
- [ ] Controls are disabled while the connection status is anything but `connected`.
- [ ] `?demo` loads with no request to the HA origin and no `/home.json` or `/config.json` fetch, shows the Demo badge, and a light tap changes the tile.
- [ ] The Playwright mock and demo mode share one fake HA module.
- [ ] Coverage stays at or above 80% on `src/domains/` and `src/infrastructure/`.
- [ ] All tests passing (`npm run format:check && npm run lint && npm test && npm run build`, plus `npm run test:e2e -- --grep-invert @live`).
- [ ] Code follows project standards.

## Task Overview

| Task | Description                                                  | Depends On         | Status  |
| ---- | ------------------------------------------------------------ | ------------------ | ------- |
| 001  | Service gateway and action state                             | -                  | pending |
| 002  | Shared fake HA with `call_service`                           | -                  | pending |
| 003  | Two-tap confirm button                                       | -                  | pending |
| 004  | Light and switch favorite tiles toggle                       | 001, 002           | pending |
| 005  | Fan and script favorite tiles                                | 001, 002, 004      | pending |
| 006  | Scene tiles and suggestion buttons                           | 001, 002, 004, 005 | pending |
| 007  | Left-on attention actions with recheck and confirm           | 001, 002, 003, 004 | pending |
| 008  | Filter "Mark replaced" runs the reset script                 | 001, 002, 003, 004, 005, 007 | pending |
| 009  | Demo connection and `?demo` mode shell                       | 001, 002           | pending |
| 010  | Demo house seed and demo controls                            | 001, 002, 004, 005, 006, 009 | pending |
| 011  | Docs: gateway, demo mode, status                             | 001–010            | pending |

## Architecture Notes

- **Gateway location and shape.** `src/infrastructure/serviceGateway/` holds `ServiceGateway = { callService(domain, service, data?, target?): Promise<void> }`, `createWebSocketGateway(connect = getConnection, status = connectionStatus)`, `ServiceGatewayProvider`, and `useServiceGateway()`. The fake for Vitest lives in `src/test/fakeServiceGateway.ts`. The gateway is the only module that imports `callService` from the library.
- **Provider default.** The context default is the module-level WebSocket gateway, and the provider passes that same stable value, so existing tests that render without a provider keep working and memoized sections don't re-render. Task 001 also adds `renderWithHome(ui, { gateway })` and `setConnected()` / `resetConnectionStatus()` test helpers for tasks 004–008.
- **Containers and presentational components.** `FavoriteTile`, a new `AttentionAction`, and each suggestion button are the containers that call `useServiceGateway`/`useAction`/`useControlsEnabled`. `Tile`, `LightTile`, `ItemAction`, and `ConfirmButton` take props. Send-time rechecks read through `readEntityNow(entityId)` in `src/infrastructure/entities/`, never `entityStore` from a component (`.farseer/code-standards.md`).
- **Shared control contract (task 004).** `Tile` has a toggle mode (`aria-pressed`) and a run mode (scene, script). A tile button's accessible name is the entity's friendly name, and its state text is the description. `ActionError` in `src/features/shared/` is the one inline error element (an always-present `role="status"` region). It says "Didn't work, tap to retry" when HA rejected the call, and "Connection dropped, check before retrying" when the socket dropped mid-call and the outcome is unknown. The gateway normalizes library errors into `ServiceCallError` (`'connection-lost' | 'rejected'`). An error clears on the next tap, after 60 s, or when HA reports the target changed (`useAction`'s `clearKey`).
- **Decisions made after review.** Pending ends on HA's acknowledgement even for the garage `toggle`; the two-tap confirm is the only guard against a second toggle while the door moves. A script tile is disabled while HA reports the script as running.
- **Action targets.** A left-on rule's HA action can target a different entity than its sensor (the garage opener). The attention rules subscribe to targets too and disable an action whose target is missing or unavailable, since HA likely acks such a call without doing anything.
- **Never queue.** The gateway rejects at once, without calling the library, when `connectionStatus` is not `connected`. Components also disable controls through `useControlsEnabled()` (the same check), so the gateway refusal is a backstop, not the UI.
- **Pending lives in the action, not the entity** (architecture principle 10). A generic `useAction` hook in `src/infrastructure/serviceGateway/` returns `{ pending, failed, run }`, modeled on `useAppDataWriter`: an `inFlight` ref so a quick second tap is dropped, `failed` cleared on the next run.
- **Explicit direction.** On/off domain actions send `turn_on` or `turn_off` based on the view model at tap time, never `toggle`. The only `toggle` comes from a `home.json` left-on rule (the garage opener), and that path gets recheck plus confirm.
- **Imports.** Domain actions take the gateway and entity IDs as arguments (`domains → infrastructure` type import only). Features get the gateway from `useServiceGateway()` and call domain actions. `src/config/` stays out of domains.
- **One fake HA.** `src/infrastructure/fakeHa/` holds a pure-TS protocol core with no Playwright or browser imports and explicit `.ts` relative imports, so `e2e/` can import it through `tsconfig.node.json`. `e2e/haMock.ts` becomes a thin `WebSocketRoute` adapter. Demo mode adapts the same core to an in-browser socket that `createConnection` accepts through its `createSocket` option, so the real library, `subscribeEntities`, and the real gateway run on top of it. This refines the glossary's "fake gateway for demo mode": demo uses the real gateway over a fake HA. Task 011 updates the docs to match.
- **Infrastructure never imports domains or features**, so the demo house seed (which uses domain factories and `calmHouse()`) lives in `src/app/demo/`. Only the fake HA core lives in infrastructure.
- **Demo isolation.** In demo mode, `getConnection()` returns the demo connection; `/config.json`, `/home.json`, OAuth, and localStorage tokens are never read; the home config is `testHomeConfig`. Demo is decided per page load from `?demo` and never stored.
- **Demo connection injection.** `connection.ts` exports `installDemoConnection(connect)`. `main.tsx` awaits the demo chunk and installs it before the first render. In demo mode with nothing installed, `getConnection()` rejects instead of running the real `connect()`, which would fetch `/config.json`, read tokens, or redirect to HA's login. `useHaUrl()` returns `location.origin` in demo without calling `getConfig()`.

## Risks & Mitigations

- **A control changes the wrong device or fires later than tapped.** Mitigation: explicit on/off direction, the gateway refuses unless connected, the `inFlight` guard drops double taps, and the left-on recheck uses the latest store value at send time rather than a render-time copy.
- **The garage opener toggle reopens a door.** Mitigation: tap-twice confirm and a recheck at send time. Unit tests cover the "sensor closed between arm and confirm" case.
- **Tests or demo reach the real house.** Mitigation: `@live` guard blocks `call_service` (unchanged and covered by a test); demo never calls `getConfig()` or reads tokens; an e2e spec asserts that no request goes to the HA origin in demo.
- **The `HaMock` extraction breaks existing e2e specs.** Mitigation: task 002 is a refactor with the existing suite as its safety net; the public `HaMock` API (`setState`, `sent`, `drop`, `stall`, `setReachable`, `userData`, `systemData`) stays the same.
- **The library's internal socket contract changes.** Mitigation: the demo socket implements only what `Connection` uses (`send`, `close`, `addEventListener`/`removeEventListener`, `haVersion`, `readyState`/`OPEN`, JSON-string `message` events, an async `close` event, and a `createSocket` that can be called again for reconnects). Vitest tests run `createConnection` + `subscribeEntities` + the WebSocket gateway over it, plus a forced reconnect.
- **A stray double tap confirms the garage door in one gesture.** Mitigation: `ConfirmButton` ignores confirming taps for about 500 ms after arming, and a retry after a failure takes two taps again.
- **Demo code bloats or leaks into the real bundle path.** Mitigation: load the demo modules with a dynamic `import()` only when `?demo` is present.
- **Tiles turning into buttons breaks layout or e2e selectors.** Mitigation: keep the `<li>` wrapper with a full-size `<button>` inside, keep 44×44 px minimum targets, and check phone/tablet screenshots.
