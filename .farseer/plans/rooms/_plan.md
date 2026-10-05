# Plan: Rooms

## Created

2026-10-04

## Status

completed

## Objective

Add rooms to the Home screen: a room selector above Needs attention (Auto by default, or any HA area with controls), and a room control card after Suggestions with lights (tap, drag brightness, color detail sheet), switches, fans, helpers, scenes, scripts, and media players. Swap Lucide for MDI icons across the app first, so rooms can show HA's own area and entity icons.

## User Stories

1. As a household member, I want a room selector at the top of Home, so that the room I'm in is one tap away.
2. As a household member, I want the selector to default to Auto, so that I don't have to pick a room for the dashboard to be useful.
3. As a household member, I want the selector to say what Auto picked and why ("Auto · Garage, you're away"), so that the room card never looks random.
4. As a household member, I want to see no room card when Auto has nothing to show, so that a calm house shows a calm screen.
5. As a household member who is away from home, I want Auto to show the Garage room, so that I can check and close the garage door from my phone.
6. As a kiosk user, I want Auto never to switch to the away room on the wall screen, so that the wall doesn't show the garage just because the shared kiosk user has no person.
7. As a household member, I want to pick a specific room from a sheet, so that I can control a room I'm not in.
8. As a household member, I want the sheet to list Auto first and then rooms grouped by floor, top to bottom in floor order, so that I can find a room quickly.
9. As a household member, I want rooms without a floor (garage, porch, patios) grouped together after the floors, so that outdoor areas are still reachable.
10. As a household member, I want each room shown with its HA icon, so that rooms are easy to recognize.
11. As a household member, I want the current choice marked in the sheet, so that I know what's selected.
12. As a household member, I want my pick to stay on this device until I change it, so that the kiosk and each phone keep their own room.
13. As a household member, I want a pick to survive a reload, so that a refreshed kiosk comes back to the same room.
14. As a household member, I want a picked room that no longer exists to fall back to Auto, so that a renamed or deleted area never leaves an empty card.
15. As a household member, I want rooms to come from my HA areas, so that a new device shows up in its room without a dashboard change.
16. As a household member, I want areas with nothing to control hidden from the selector, so that the list stays short.
17. As the house owner, I want to hide an area from the selector in `home.json`, so that a stray area like a duplicate never shows.
18. As the house owner, I want to add entities from other areas to a room in `home.json`, so that the Living Room card can include the entry, kitchen, and stairs lights like the old dashboard did.
19. As the house owner, I want to remove an entity from a room in `home.json`, so that a device I never use from the dashboard stays off the card.
20. As the house owner, I want to name the room Auto shows when I'm away in `home.json`, so that the away rule doesn't depend on an area ID baked into code.
21. As the house owner, I want an entity's room to follow its device's area when the entity has none of its own, so that rooms match what HA shows.
22. As the house owner, I want hidden entities and config or diagnostic entities left out of rooms, so that restart buttons and signal sensors never become tiles.
23. As a household member, I want rooms to update when someone changes areas in HA, so that the dashboard never needs a reload after reorganizing the house.
24. As a kiosk user, I want rooms to reload after HA restarts or the network drops, so that the wall screen stays correct for weeks.
25. As a phone user signed in as a non-admin, I want rooms to work, so that the household doesn't need admin accounts.
26. As a household member, I want the room card to show the room's name and icon, so that I know which room I'm controlling.
27. As a household member, I want the room's temperature and humidity in the card header, when HA has them, so that I see how the room feels.
28. As a household member, I want the room card after Suggestions, so that what needs me stays first.
29. As a household member, I want to tap a light, switch, fan, or helper tile to turn it on or off, so that the room card works like favorites.
30. As a household member, I want scene and script tiles in the room card, so that a room's moods are there too.
31. As a household member, I want covers, climate, and locks shown with their state but no controls, so that nothing risky is one tap away until those controls are built properly.
32. As the house owner, I want a `confirm` list in `home.json`, so that entities like the garage opener always ask for a second tap.
33. As a household member, I want a confirm-listed tile to slide to "Confirm?" on the first tap and send on the second, so that I can't open the garage by brushing the screen.
34. As a household member, I want the confirm list to apply to favorites too, so that a risky entity is safe wherever it appears.
35. As a household member, I want to drag across a light tile to set its brightness, so that I don't need a separate screen to dim a light.
36. As a household member, I want the tile to show the level while I drag, so that I know where it will land.
37. As a household member, I want the brightness sent once when I let go, so that the bulbs don't get flooded with commands.
38. As a household member, I want a vertical swipe over a light tile to scroll the page, so that brightness doesn't change by accident when I scroll.
39. As a screen reader or keyboard user, I want brightness exposed as a slider I can change with arrow keys, so that dimming isn't touch-only.
40. As a household member, I want a light that only turns on and off to have no brightness drag, so that the tile doesn't pretend it can dim.
41. As a household member, I want a visible ⋯ button on lights that support color temperature or color, so that the extra controls aren't behind a hidden gesture.
42. As a household member, I want a color-temperature slider in the light's sheet, limited to the light's own range, so that I can warm or cool a light.
43. As a household member, I want a row of color swatches in the sheet for color lights, so that picking a color is one tap on a phone.
44. As a household member, I want the sheet to show only the controls the light supports, so that a white-only bulb doesn't show colors.
45. As a household member, I want a failed brightness, temperature, or color change shown inline, so that I know HA didn't take it.
46. As a household member, I want each playing or paused media player in the room shown with its artwork, title, and controls, so that I can manage what's on.
47. As a household member, I want play/pause, previous, and next on an active player, shown only when the player supports them, so that buttons always do something.
48. As a household member, I want a volume slider on an active player that sends when I let go, so that I can turn it down quickly.
49. As a household member, I want idle and off players collapsed to small chips with a power button, so that a room with three players stays short.
50. As a household member, I want play/pause to send an explicit play or pause based on what's showing, so that a double tap can't flip it back.
51. As a household member, I want controls disabled while disconnected or while the entity is unavailable or missing, so that the dashboard never pretends a tap worked.
52. As a household member, I want MDI icons throughout the app, so that icons match what HA uses and the garage has a real garage icon.
53. As the house owner, I want HA's own icon for an area or entity used when the dashboard knows it, and a sensible default otherwise, so that icons never go blank.
54. As a kiosk user, I want the icon change not to bloat the app, so that the wall screen still loads fast.
55. As someone trying the dashboard, I want `?demo` to show rooms with placeholder areas and floors, so that I can try the selector and controls without a real house.
56. As the house owner, I want a read-only live test that loads the real registries and lists rooms, so that HA protocol drift is caught.

## Related Issues

- Task 001: #45
- Task 002: #46
- Task 003: #47
- Task 004: #48
- Task 005: #49
- Task 006: #50
- Task 007: #51
- Task 008: #52
- Task 009: #53
- Task 010: #57
- Task 011: #54
- Task 012: #58
- Task 013: #55
- Task 014: #59
- Task 015: #60
- Task 016: #61
- Task 017: #62
- Task 018: #63
- Task 019: #56

## Discovery Notes

- **No routing.** `AppShell` renders `HomeScreen` and `SettingsSheet`. Rooms live on Home: the selector at the top of column 1 (before Needs attention), the room card after Suggestions. Column 1 holds attention, suggestions, crypto today (`src/features/home/HomeScreen.tsx`, phone order classes in `src/styles/layout.css`).
- **Registries (checked against HA 2026.9.4 source and the live instance).** `config/area_registry/list`, `config/floor_registry/list`, `config/device_registry/list`, and `config/entity_registry/list_for_display` are not admin-gated, and `area_registry_updated`, `floor_registry_updated`, `device_registry_updated`, `entity_registry_updated` are in `SUBSCRIBE_ALLOWLIST` (`homeassistant/auth/permissions/events.py`), so non-admin phones can read and follow them. `list_for_display` returns `{entity_categories, entities: [{ei, pl, ai?, di?, ic?, lb?, ec?, hb?, en?, hn?, tk?}]}`: `ai` is the entity's own area, `di` its device, `ec` an entity-category index, `hb` hidden. Areas carry `area_id, name, icon (mdi:*), floor_id, temperature_entity_id, humidity_entity_id, aliases, labels, picture`. Floors carry `floor_id, name, level, icon, aliases`. None of these are in the fake HA yet.
- **The live house.** 4 floors with levels 0–3, 29 areas, 8 with no floor (garage, patios, porch, deck, outdoors, stairs, a stray "Double Down"). About 17 areas have controllable entities; 12 have none. Controllable kinds present: light, switch, fan (on/off), input_boolean (2), scene, script, media_player (5, three in one room), button (34, mostly AP restarts and PoE power cycles: excluded), remote (excluded). There are **no** cover, climate, or lock entities, so those stay display-only (decided). Area IDs carry floor prefixes (`02_kitchen`) but floors are real, so grouping uses the floor registry, never the prefix.
- **The old Lovelace dashboard** had `input_select.room_select` with options Auto, seven rooms, and Not Home. Its Living Room card pulled lights from the entry, kitchen, and stairs; Auto with the owner away showed the garage door. The new app ignores the helper (no automation uses it) and reproduces the behavior with HA areas, `home.json` tweaks, and an away source.
- **Person ↔ user.** HA's `person` state has a `user_id` attribute; `useCurrentUser()` (`src/infrastructure/ha/useCurrentUser.ts`) gives the signed-in user's id. The kiosk logs in as a shared user with no person, so the away rule never fires there (decided: "signed-in person only").
- **Controls today.** `FavoriteTile` (`src/features/home/favorites/FavoriteTile.tsx`) dispatches by HA domain to `LightTile`/`OnOffTile`/`SceneTile`/`ScriptTile`/`StateTile` over `useAction`. `setOnOff` (`src/domains/onOffActions.ts`) sends explicit `turn_on`/`turn_off`. `ConfirmButton` (`src/features/shared/ConfirmButton.tsx`) is the two-tap confirm. The fake HA's generic on/off handling covers `light`, `switch`, `fan` (`SWITCHABLE` in `src/infrastructure/fakeHa/fakeHa.ts`).
- **The bottom sheet** is `SettingsSheet` in `src/app/settings/`. Features can't import `app/`, so the generic sheet moves to `src/features/shared/` for the room picker and light detail sheet.
- **Icons.** `lucide-react` is imported in 15 source files (theme toggle, attention badges/actions/snooze, crypto, favorites, header, media, `SectionCard`, suggestions, systems, Today/weather icons). `@mdi/js` (7.4.x) exports one SVG path string per icon (`mdiGarage`), tree-shaken when imported by name. HA hands icon names at runtime (`mdi:glass-cocktail`), which can't be tree-shaken, so a curated map of about 150 home-automation names resolves them, with an area or HA-domain fallback (decided).
- **Settled in the interview:**
  - Full rooms in this plan; covers, climate, locks display-only (no devices to verify against).
  - Selector: full-width button above Needs attention, opening a sheet (Auto, then floors by level, then "Other" for areas without a floor).
  - Selection per device in localStorage, stays until changed; Auto is the default.
  - Auto runs room sources in order. The only source now: the signed-in person is not home → the `home.json` away room. Else no room card. Presence sources come later.
  - Membership: HA areas with controls, plus `home.json` `rooms` tweaks (hide areas, add or remove entities per area).
  - A top-level `home.json` `confirm` list makes an entity two-tap everywhere (rooms and favorites).
  - Card: area temperature/humidity in the header; lights tap/drag (send on release) with a visible ⋯ detail sheet (temp slider + swatches); switches, fans, input_booleans toggle; scenes, scripts; media: active players full rows (art, title, transport, volume on release), idle/off as chips with power; buttons and remotes excluded.
  - MDI replaces Lucide everywhere, as this plan's first tasks.

## Scope

### In Scope

- MDI icon component, curated runtime icon map with fallbacks, and the swap of every Lucide import; `lucide-react` removed.
- Registry subscription in infrastructure (areas, floors, devices, entity display list) that refreshes on registry events and reconnects; fake HA support for the four list messages, `subscribe_events` and the four update events, and service data on calls.
- `home.json` `rooms` section (hidden areas, per-area add/remove, away room) and top-level `confirm` list.
- Pure room model: area resolution, eligible kinds, floor grouping, hiding empty areas, config tweaks.
- Room selection per device, the room-source interface, and the away source.
- The generic bottom sheet moved to `src/features/shared/`.
- Room selector button and picker sheet on Home.
- A shared entity tile extracted from favorites (with `input_boolean`), used by favorites and rooms.
- Room card on Home with header temperature/humidity and tiles.
- Confirm list applied to tiles in rooms and favorites.
- Light brightness drag (room card), the light detail sheet (color temp, swatches).
- Media player rows (transport, power chips) and volume.
- Demo house areas/floors/registries, a read-only `@live` registry spec, and doc updates.

### Out of Scope

- Cover, climate, and lock controls (display-only until a device exists).
- Automatic room sources beyond the away rule (occupancy, UniFi AP, BLE/Bermuda).
- Buttons and remotes in rooms.
- Brightness drag on favorites tiles (rooms only for now).
- Fan speed, media source select, seek, and shuffle/repeat.
- A separate rooms route or tab bar.
- Making the Home Media card interactive.
- Any change to HA (no helpers, no area edits); `input_select.room_select` stays untouched.

## Success Criteria

- [ ] The selector lists Auto and every area with controls, grouped by floor level, with no area that has nothing to control.
- [ ] Picking a room shows its card after Suggestions on phone and tablet; the pick survives a reload on that device only.
- [ ] Auto shows the away room on a phone whose person is away, and nothing otherwise; the kiosk never shows it.
- [ ] Room membership follows HA areas and `home.json` tweaks, and updates live when an area changes in HA.
- [ ] Lights toggle on tap, dim on drag (one call on release), and open a detail sheet only when they support temperature or color.
- [ ] Active media players have working transport and volume; idle/off players are chips with power.
- [ ] Every confirm-listed entity needs two taps in rooms and favorites.
- [ ] No file imports `lucide-react`; the main bundle doesn't grow by the whole MDI set.
- [ ] `?demo` shows rooms; the `@live` registry spec passes read-only.
- [ ] All tests passing (`npm run format:check && npm run lint && npm test && npm run build`, Playwright mocked specs)
- [ ] Code follows project standards

## Task Overview

| Task | Description                                              | Depends On         | Status  |
| ---- | -------------------------------------------------------- | ------------------ | ------- |
| 001  | MDI Icon Component and Runtime Icon Map                  | -                  | completed |
| 002  | Swap Lucide for MDI: Shell, Header, Attention, Suggested | 001                | completed |
| 003  | Swap Lucide for MDI: Favorites and Display Cards         | 001                | completed |
| 004  | Remove Lucide                                            | 002, 003           | completed |
| 005  | Registry Store and Subscription                          | -                  | completed |
| 006  | `rooms` and `confirm` Sections in home.json              | -                  | completed |
| 007  | Room Model from Areas, Floors, and Config                | 005, 006           | completed |
| 008  | Shared Bottom Sheet                                      | -                  | completed |
| 009  | Room Selection and Room Sources                          | 006, 007           | completed |
| 010  | Room Selector on Home                                    | 001, 008, 009, 019 | completed |
| 011  | Shared Entity Tile with Helpers                          | 003                | completed |
| 012  | Room Card on Home                                        | 010, 011, 013      | completed |
| 013  | Confirm List on Tiles                                    | 006, 011           | completed |
| 014  | Light Brightness Drag                                    | 012, 013           | completed |
| 015  | Light Detail Sheet                                       | 008, 014           | completed |
| 016  | Media Player Rows                                        | 012                | completed |
| 017  | Media Volume Slider                                      | 014, 016           | completed |
| 018  | Demo Rooms, Live Registry Spec, and Docs                 | 004, 012, 015, 017 | completed |
| 019  | Fake HA Registries, Events, and Service Data             | -                  | completed |

## Architecture Notes

- **Layers.** Registry fetching and the registry store live in `src/infrastructure/registries/` (like the entity store: one external store, `useSyncExternalStore` selector hooks). The room model, selection, and sources live in `src/features/rooms/` (pure functions plus hooks). Room UI (selector, card) lives in `src/features/rooms/` and is placed by `HomeScreen`. Domains get new actions only: `domains/light/actions.ts` (`setBrightness`, `setColorTemp`, `setColor`), `domains/media_player/actions.ts` (`play`, `pause`, `nextTrack`, `previousTrack`, `setVolume`, `setPower`), and `input_boolean` through `setOnOff`. Imports still flow `app → features → domains → infrastructure`.
- **Registry shapes stay in infrastructure.** Infrastructure maps HA's wire shapes (`ei`, `ai`, `di`, `hb`, `ec`) into plain typed records (`AreaRecord`, `FloorRecord`, `DeviceRecord`, `EntityRecord`) once; nothing above infrastructure sees the abbreviated keys.
- **Room-source interface** (from planning):

  ```ts
  type RoomSourceContext = {
    rooms: RoomsModel
    awayRoom?: string // from home.json rooms.awayRoom
    currentUserId?: string
    persons: PersonViewModel[] // PersonViewModel gains userId (009)
    kiosk: boolean // isKioskDevice(); the away source never fires when true
  }
  type RoomSource = { id: string; resolve(ctx: RoomSourceContext): RoomPick | undefined }
  type RoomPick = { areaId: string; reason: string } // reason feeds "Auto · Garage, you're away"
  type RoomSelection = { kind: 'auto' } | { kind: 'room'; areaId: string }
  ```

  A manual pick wins. Auto tries sources in order and takes the first pick whose area is a current room. A manual pick whose area is no longer a room resolves as Auto. The selection lives in one module-level store (`createStore`), so the selector and the room card always agree.

- **Registry lifecycle.** `startSession` starts the registry subscription next to `subscribeEntities` and stops it in the same cleanup. A refetch (after an event or a reconnect) keeps the last good registries on screen; `error` only when nothing has ever loaded, and the next `ready` recovers from it.
- **Shared placeholder house for rooms** (used by 006's `testHomeConfig`, 019's `placeholderRegistries.ts`, the rooms specs, and 018's demo house; generic names only):
  - Floors: `ground_floor` ("Ground Floor", level 0), `upstairs` ("Upstairs", level 1).
  - Areas: `living_room` (ground, `mdi:sofa`, temperature `sensor.living_room_temperature`, humidity `sensor.living_room_humidity`), `kitchen` (ground, `mdi:countertop`), `bedroom` (upstairs, `mdi:bed`), `office` (upstairs, `mdi:desk`), `garage` (no floor, `mdi:garage`), `porch` (no floor, `mdi:coach-lamp`), `storage` (no floor; hidden by config).
  - `testHomeConfig.rooms`: `{ hidden: ['storage'], awayRoom: 'garage', areas: { living_room: { add: ['light.kitchen_pendant'], remove: ['switch.unused_plug'] } } }`; `testHomeConfig.confirm`: `['switch.garage_door_opener']` (already the left-on action's target).
  - The Playwright `HaMock` defaults to empty registries (no rooms, no selector), so existing specs and their layout checks don't change; rooms specs opt in.

- **Sends.** Every new control goes through domain actions and `useAction` (enabled only while connected, disabled when the target isn't `ok`). Sliders hold the dragged value in local component state while dragging, and keep showing the released value only while that send is pending (action state); once it settles the tile shows HA's state again (principle 10: no optimistic entity copy). The fake HA applies service data through a per-HA-domain handler table (019); each control task adds its entry. Play/pause sends explicit `media_play` or `media_pause` from what's showing, never `media_play_pause`. Light on/off stays explicit `turn_on`/`turn_off`.
- **Confirm list.** Resolved once in the shared entity tile: if the entity is in `confirm`, its press goes through `useConfirmArm` (the arm/disarm logic extracted from `ConfirmButton`); covers favorites and rooms alike. A confirm-listed entity gets no one-gesture extras: no brightness drag, no ⋯ sheet, no volume slider; a confirm-listed media player's power and play/pause also go through `useConfirmArm`.
- **Sheets** render through a portal to `document.body`, so a sheet opened from inside Home isn't dimmed by `.content[data-stale]` or trapped in its stacking context.
- **Icons.** `Icon` takes an `@mdi/js` path; `iconForHa(name, fallback)` resolves a runtime `mdi:` name through the curated map. Static UI icons import paths by name. Never import the whole `@mdi/js` module object dynamically.
- **Verify before relying on wire shapes**: before writing a light, media player, or registry payload, check the HA 2026.9.4 source or the live instance (CLAUDE.md rule). Feature bits used here: media `PAUSE=1, VOLUME_SET=4, PREVIOUS_TRACK=16, NEXT_TRACK=32, TURN_ON=128, TURN_OFF=256, PLAY=16384`; light `supported_color_modes` (`onoff`, `brightness`, `color_temp`, `hs`, `xy`, `rgb`, `rgbw`, `rgbww`, `white`), `min_color_temp_kelvin`/`max_color_temp_kelvin`, and `light.turn_on` with `brightness_pct`, `color_temp_kelvin`, `hs_color`.
- **Public repo.** Fixtures, demo data, and the curated icon map use placeholder areas and entity IDs. No real area names or entity IDs from the house in code, tests, or docs.

## Risks & Mitigations

- **Icon swap breaks shipped cards visually**: migrate in two batches with screenshots checked at phone and tablet sizes; `e2e/icons.spec.ts` and per-card specs keep their accessible names, which don't depend on the icon set.
- **Bundle growth from MDI**: only named imports; the curated map is a fixed list. Task 004 adds a test that no source imports `lucide-react` and that `@mdi/js` is only imported by name; check the build's main chunk size against `master` before and after.
- **Registry load on a non-admin phone fails or drifts**: the messages are verified non-admin on 2026.9.4; task 018's `@live` spec loads them read-only, and the registry store reports an error state that hides the selector rather than crashing Home.
- **Accidental brightness changes while scrolling**: horizontal-drag threshold before the slider engages, `touch-action: pan-y` on the tile, and a vertical swipe test.
- **Garage opener toggled from a room by accident**: the `confirm` list (013) lands before the room card (012 depends on 013), so a room tile is never one tap away, and `home.example.json` lists the opener as an example.
- **Room card too tall on phones (three media players)**: idle/off players collapse to chips; only active players get full rows.
- **Many parallel tasks touch `HomeScreen.tsx` and the shared tile**: dependencies serialize them (013 → 012, 010 → 012 → 014); `EntityTile`'s `variant` prop (011) keeps 014/015 out of `RoomCard.tsx`; media rows (016) live in their own files; the fake HA handler table (019) gives each control task its own entry instead of one shared function.
