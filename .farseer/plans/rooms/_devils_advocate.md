# Devil's Advocate Review: rooms

Checked against the code on `feature/rooms` (base `995fa90`). The decisions settled in the interview are not reopened here.

## Critical (Must fix before building)

1. **002 and 003 run in parallel, but only 002 makes `SectionCard` accept an MDI path.** `SectionCard.tsx` types `icon?: LucideIcon`. Task 003 changes the Crypto, Today, Systems, Media, and Favorites callers to pass path strings. If 003 builds before 002 merges, `tsc -b` fails on every caller. **Fix:** move the temporary widening (`icon?: string | LucideIcon`) into 001, the expand step. 002 and 003 stay parallel, and 004 narrows the type as planned.

2. **The selector and the room card would each keep their own copy of the selection (009, 010, 012).** As written, `useSelectedRoom()` returns `{ resolved, select }` and reads localStorage. If each caller holds that in `useState`, a pick in the selector never reaches the card until a reload. **Fix:** keep the selection in one module-level store (`createStore` from `src/infrastructure/store.ts`) inside `src/features/rooms/`, initialized from localStorage once. Add a test that a pick made through one hook instance shows up in another.

3. **The fake HA can't carry service data, and four tasks edit the same function at once (014, 015, 016, 017).** `ServiceCall` is `{ domain, service, entityIds }` and `applyService(entity, domain, service)` ignores `service_data`, so `brightness_pct`, `color_temp_kelvin`, `hs_color`, and `volume_level` can't be applied. 014 and 016 run in parallel, and both would rewrite `applyService` and the exported `ServiceCall` type that `demoHouse.ts`'s `onServiceCall` uses. **Fix:** new task 019 (fake HA work, no dependencies) adds `serviceData` to `ServiceCall`, splits `applyService` into a per-HA-domain handler table, adds `input_boolean` to the on/off handling, and adds the registry messages and `subscribe_events` (see Important 1). The later tasks each add one handler entry.

## Important (Should fix before building)

1. **005 is too large, and the fake HA can't serve it.** The fake HA has no `subscribe_events` case (it answers `unknown_command`), so `conn.subscribeEvents` rejects in demo mode and Playwright. 005 also bundled the store, debounce, reconnect, error state, mapping, the hook, four fake list messages, four events, `setRegistry`, the `HaMockOptions` changes, and placeholder registries. **Fix:** split the fake HA half into 019. 010 (the first Playwright consumer) depends on 019.

2. **Nothing says where the registry store starts, and `src/test/fakeConnection.ts` breaks once it does (005).** "Follow `session.ts`" leaves the activation path open. If registries start inside `startSession`, the fake connection used by `session.test.tsx`, `App.kiosk.test.tsx`, `App.homeConfig.test.tsx`, `useEntity.test.tsx`, and `serviceGateway.test.ts` has no `subscribeEvents`. Its `subscribeMessage` also keeps a single callback, so a second subscription would steal the entity events. **Fix:** 005 calls `startRegistries(conn)` from `startSession`'s connect callback and adds it to the cleanup. It extends the fake connection so subscriptions are routed by message type (entity events keep working) and `subscribeEvents` exists. A rejected event subscription is caught and leaves the store usable.

3. **A reconnect would blank the rooms UI on the kiosk (005).** The plan refetches all four lists on `ready`. Nothing says what the store holds meanwhile. If a refetch goes back to `loading`, or a failed refetch goes to `error`, the selector and room card disappear on every network blip. **Fix:** keep the last good registries through a refetch and through a failed refetch. Show `error` only when nothing has ever loaded, and let the next `ready` recover from it. Expose a test-only reset, because the store is a module singleton shared across unit tests.

4. **The Playwright default registries would change every existing mocked spec (019, 010).** 005 made `placeholderRegistries.ts` the Playwright default. Once rooms exist in a spec's house, the selector sits above Needs attention. That breaks `e2e/home.spec.ts`'s tablet check that Favorites and Needs attention start within 2 px of each other, and it moves screenshots. **Fix:** default `HaMock` registries are empty lists, so no rooms and no selector. `e2e/rooms.spec.ts` and demo mode opt in.

5. **The placeholder area IDs are an unwritten contract between parallel tasks (019, 006, 007, 010, 012, 018).** `testHomeConfig.rooms` (006) refers to area IDs from the placeholder registries (now 019), and the demo house (018) uses `testHomeConfig` itself (`App.tsx`: `DEMO_HOME_CONFIG = testHomeConfig`). 006 and 019 have no dependency between them. **Fix:** fix the placeholder floor and area IDs and the `testHomeConfig` `rooms`/`confirm` values in `_plan.md`. 006, 019, and 018 all use them.

6. **Room entity ordering "then by name" has no name source (007).** The registry's `en` is the entity's own name (with `has_entity_name` it's often just "Light"), not `friendly_name`. `friendly_name` lives in the entity store, and subscribing the model to every state would rebuild it on each light change. **Fix:** `buildRooms` takes a `nameOf(entityId)` function. `useRooms` passes one that reads `friendly_name` through `readEntityNow` (no subscription), falls back to the `entity_id`, and recomputes when registries, config, or the set of entity IDs change.

7. **The away source has no person view model to read, and the kiosk guard is only an assumption (009).** `PersonState` doesn't exist. `PersonViewModel` has no `user_id`, and there are no "existing person hooks" (Presence uses `useEntityIds(isPerson)` + `useEntitiesById`). Also, "the kiosk never shows the away room" depends on the kiosk token belonging to a user with no person. A token made from the owner's account would show the garage on the wall whenever the owner is out. **Fix:** add `userId?: string` to `PersonViewModel`. Read persons with the Presence pattern. Add `kiosk: boolean` to `RoomSourceContext` (from `isKioskDevice()`), and the away source returns nothing when it's set. This enforces the decision instead of reopening it.

8. **A bottom sheet rendered from inside Home would be dimmed and trapped in the wrong stacking context (008, 010, 015).** `SettingsSheet` sits outside `.content` in `AppShell`. The room picker and light sheet would render inside `.content`, and `.content[data-stale]` sets `opacity`, which creates a stacking context: the sheet dims during a reconnect and its `z-index: 20` only counts inside `.content`. **Fix:** `BottomSheet` renders through `createPortal(…, document.body)`.

9. **The confirm list can't reuse `ConfirmButton` on a tile (013).** `ConfirmButton` renders its own `ActionButton` with a fixed `className`, an `aria-label`, and icon-only content. `ControlTile` names its button with `aria-labelledby` and `aria-pressed` and fills the whole tile. **Fix:** extract the arm, guard, timeout, outside-tap, and blur logic into `useConfirmArm()` in `src/features/shared/`. `ConfirmButton` uses it (its tests pass unchanged) and so does `ControlTile`.

10. **Confirm-listed room tiles would ship one tap away for a while (012, 013).** 012 exposes room tiles, the garage opener included, before 013 adds the confirm. **Fix:** reorder. 013 depends on 006 and 011 only, and 012 depends on 013. That's no longer on the critical path, and the room card gets the confirm for free through `EntityTile`.

11. **One-gesture extras bypass the confirm list (014, 015, 016, 017).** Brightness drag, the ⋯ sheet, media transport and power, and the volume slider each send in one gesture. "Two-tap everywhere" needs a rule. **Fix:** a confirm-listed light has no drag and no ⋯ button. A confirm-listed media player's power and play/pause go through `useConfirmArm`, and it has no volume slider.

12. **Drag on a `<button>` toggles the light at the end of every drag (014).** After pointerdown and pointerup on the same button, the browser fires `click`, so `ActionButton.onPress` toggles after a drag. The tile is also one `ActionButton`, so a ⋯ button (015) can't go inside it (that would nest interactive content), and a separate `role="slider"` needs its own element. **Fix:** spell out the tile structure. Inside the `li`: the toggle `ActionButton` (also the drag surface, using `setPointerCapture`, with the `click` after an engaged drag swallowed), a focusable `role="slider"` element, and a `trailing` slot that 015 fills with ⋯ (stopping pointer propagation). Add the test "it doesn't toggle when a drag ends".

13. **The tile jumps back after release (014, 017).** "After release the tile shows HA's brightness again" makes the fill snap back to the old level until HA reports the new one, which can take a second on Zigbee or Hue. **Fix:** while the release's action is pending (`useAction`'s `pending`, which is action state, not an entity copy), show the released value. After it settles, show HA's value. Principle 10 allows this.

14. **015 contradicts itself about off lights.** It says "controls disabled until it's on" and also "a color or temp change on an off light turns it on with that value". HA also drops `color_temp_kelvin` and `hs_color` from an off light's attributes, so there's no "last known value". **Fix:** controls stay enabled. A change sends `light.turn_on` with that value (turning the light on). While the light is off, the temperature slider rests mid-range with `aria-valuetext` saying the light is off, and no swatch is pressed.

15. **The media chip's power button has no direction rule (016).** `off` and `standby` should get `turn_on`. `idle` and the `other` bucket (`on`, `buffering`) are on and should get `turn_off`. Each also needs its feature bit (`TURN_ON`/`TURN_OFF`), or no button. **Fix:** state the rule and test both directions.

16. **Icon-identity tests are tied to Lucide class names (002, 003).** `e2e/theme-toggle.spec.ts` uses `svg.lucide-moon` and `svg.lucide-sun`. `attentionIcons.test.tsx` asserts `lucide-warehouse` and similar, and `weatherIcon.test.ts` imports Lucide components. "Specs keep passing unchanged" can't hold for these. **Fix:** list them. Rewrite them to compare the rendered `<path d>` with the imported `@mdi/js` constant (Playwright can import `@mdi/js`).

17. **The Today card's weather CSS assumes Lucide's stroked, multi-path icons (003).** `.wx-icon--partly path:last-child` colors the cloud of Lucide's two-path cloud-sun, and `.wx-icon--sun`/`--cloud` mix `fill` with `stroke`. MDI glyphs are a single filled path. **Fix:** 003 replaces those rules: color comes from `color`, and partly cloudy either stacks two glyphs or goes one color, chosen from screenshots.

18. **014 edits `RoomCard.tsx` while 016 rewrites it in parallel.** **Fix:** 011 gives `EntityTile` a `variant: 'favorite' | 'room'` prop, and 012 passes `variant="room"`, so 014 and 015 only touch the light tile.

19. **The `@live` guard doesn't block registry writes (018).** `FORBIDDEN` in `e2e/fixtures.ts` is `/^(call_service|frontend\/set_.*)$/`. This plan adds the first `config/*` traffic to live tests, which run as an admin. **Fix:** block `config/*/(create|update|delete|remove)` too, so a live spec can never edit areas, floors, devices, or entities.

## Minor (Nice to address)

- 006 says validation "matches the existing parser's style", but `parseHomeConfig` neither checks the entity ID format nor rejects unknown keys today. The new checks are new helpers. That's fine, but don't go looking for existing ones.
- The `_plan.md` room-source sketch has `rooms: Room[]` while 009 uses `RoomsModel` (aligned in `_plan.md` as part of Important 7).
- `.farseer/code-standards.md` says to keep HA's spelling (`entity_id`) and map it in view models. The registry records use `entityId`/`areaId`. Pick one and say so in 005, since existing view models use `entity_id`.
- 011 moves tiles to `src/features/shared/tiles/`, but they import `STATUS_TEXT` from `src/features/home/statusText.ts`, which `TodayCard` uses too. Move it to `features/shared/` as well.
- `src/features/shared/motion.ts` already exists, so a `motion/` folder next to it would make `./motion` imports ambiguous (008). Use `src/features/shared/spring.ts`.
- `HomeScreen` re-renders on each clock tick. Wrap `RoomSelector` and `RoomCard` in `memo` as `FavoritesSection` is.
- Every Vitest file that imports a component using `Icon` loads all of `@mdi/js` (about 3 MB). Watch test time after 002 and 003.
- 016 imports `src/features/home/media/MediaCard.css` from `features/rooms`. Lift the shared chip rules instead of importing another feature's stylesheet.
- `useCurrentUser` fetches per hook instance and doesn't refetch after a reconnect. The selector and card both call it, which is harmless but means two `auth/current_user` calls.
- The `@live` specs run as an admin, so the non-admin claim (story 25) is only checked against the source, not live.

## Questions for the Team

1. Should `rooms.areas.<id>.add` accept HA domains outside the eligible list (for example a `button`, or a `sensor` shown display-only), or should 007 drop them like any other ineligible entity? The plan doesn't say.
2. On a tablet, the selector now tops column 1, so Needs attention starts lower than Favorites. Is that acceptable, or should the selector span the full grid width above all columns? (010 keeps it in column 1 as decided and lines the selector's top up with Favorites.)
3. Partly-cloudy weather icon: is a single-color MDI glyph fine, or do you want the two-tone sun-behind-cloud look kept by stacking two glyphs?
4. Should a person in a named zone (Work) count as away for the away source? The plan says yes ("anything other than `home`"). Confirm that's what you want before the garage shows up during the workday.
