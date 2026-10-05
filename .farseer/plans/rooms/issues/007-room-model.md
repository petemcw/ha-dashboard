# Task 007: Room Model from Areas, Floors, and Config

**Status**: completed
**Issue**: #51
**Depends on**: 005, 006
**Retry count**: 0

## Description

A pure function that builds the house's rooms from the registry records, the live entity IDs, and `home.json`'s `rooms` section: which entities belong to which area, which areas are hidden, and how rooms group by floor. A hook exposes the result to features. This is the single definition of "a room" every later task uses.

## Context

- Related files: new `src/features/rooms/roomModel.ts` (+ test), `src/features/rooms/useRooms.ts`, `src/infrastructure/registries/` (from 005), `src/config/homeConfig.ts` (`RoomsConfig` from 006), `src/infrastructure/entities/useEntityIds.ts` (live entity IDs without subscribing to every state; pass a module-constant predicate), `src/infrastructure/entities/readEntityNow.ts`.
- **Names for ordering.** The registry's `en` is the entity's own name (with `has_entity_name` often just "Light"), not what the tile shows. `friendly_name` lives in the entity store, and subscribing the model to every state would rebuild it on each light change. So `buildRooms(registries, liveEntityIds, roomsConfig, nameOf)` takes a `nameOf(entityId)` function; `useRooms` passes one that reads `friendly_name` through `readEntityNow` (no subscription) and falls back to the `entity_id`. The model recomputes when the registries, the config, or the set of live entity IDs change; a rename shows up on the next of those, which is fine.
- Use the placeholder floors and areas from `_plan.md` ("Shared placeholder house for rooms") in tests.
- Output shape:

  ```ts
  type Room = {
    areaId: string
    name: string
    icon?: string // HA's mdi: name, resolved to a path by the UI
    floorId?: string
    temperatureEntityId?: string
    humidityEntityId?: string
    entityIds: string[] // ordered: lights, switches, fans, input_booleans, scenes, scripts, media players, covers, climate, locks; then by name
  }
  type FloorGroup = { floorId?: string; name: string; level?: number; rooms: Room[] }
  type RoomsModel = { groups: FloorGroup[]; byAreaId: Map<string, Room> }
  ```

- Rules:
  - An entity's area is its own `areaId`, else its device's `areaId` (HA's rule).
  - Hidden entities and entities with a category (config/diagnostic) are left out.
  - Eligible HA domains: `light`, `switch`, `fan`, `input_boolean`, `scene`, `script`, `media_player`, `cover`, `climate`, `lock`. Everything else (buttons, remotes, sensors) is left out.
  - Registry entries for entities HA doesn't currently report (not in the live entity IDs) are left out; an ID added through `home.json` that doesn't exist is kept, so the tile shows "missing" (principle 12).
  - `home.json` `add` puts an entity in that area (and keeps it in its own area too); `remove` takes it out of that area only. `hidden` areas never appear.
  - An area with no eligible entities after the tweaks is not a room.
  - Floors sort by `level` ascending (a floor without a level sorts with level 0, as HA does), rooms within a floor by name. Areas without a floor form a last group named "Other". Empty floors are dropped.
- `useRooms()` returns `undefined` while registries load and on registry error, so callers render nothing.

## Requirements (Test Descriptions)

- [x] `it puts an entity in its own area before its device's area`
- [x] `it puts an entity with no area of its own in its device's area`
- [x] `it leaves out hidden entities, categorized entities, and ineligible domains`
- [x] `it leaves out an area with nothing eligible to control`
- [x] `it adds and removes entities per area from home.json and hides hidden areas`
- [x] `it groups rooms by floor level with areas that have no floor last under Other`
- [x] `it orders a room's entities by kind and then by name`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes
Added a floor-without-level test and an unreported-entity test beyond the list. `useRooms` lives in `src/features/rooms/useRooms.ts` and has no dedicated test.
