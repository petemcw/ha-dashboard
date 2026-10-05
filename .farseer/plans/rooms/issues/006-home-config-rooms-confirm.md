# Task 006: `rooms` and `confirm` Sections in home.json

**Status**: completed
**Issue**: #50
**Depends on**: none
**Retry count**: 0

## Description

Add two optional sections to the runtime `home.json`: `rooms` (areas to hide, entities to add to or remove from an area, and the away room) and a top-level `confirm` list of entity IDs that always need a two-tap confirm. Parse them strictly, like the other sections, so a typo is reported instead of silently ignored.

## Context

- Related files: `src/config/homeConfig.ts` (+ `homeConfig.test.ts`), `src/config/testHomeConfig.ts`, `home.example.json`.
- Shape (from planning):

  ```json
  "rooms": {
    "hidden": ["placeholder_area"],
    "awayRoom": "garage",
    "areas": {
      "living_room": { "add": ["light.entry_lamp"], "remove": ["switch.unused_plug"] }
    }
  },
  "confirm": ["switch.garage_door_opener"]
  ```

  ```ts
  type RoomsConfig = {
    hidden: string[]
    awayRoom?: string
    areas: Record<string, { add: string[]; remove: string[] }>
  }
  // HomeConfig gains: rooms: RoomsConfig (defaults when absent) and confirm: string[]
  ```

- Both are optional. A missing `rooms` means no hidden areas, no tweaks, and no away room (so the away source never fires). A missing `confirm` is an empty list.
- Validation matches the existing parser's style: entity IDs must look like `<domain>.<object_id>`, area IDs are non-empty strings, unknown keys inside `rooms` are rejected with a message naming the path (`rooms.areas.living_room.add[0]`). The existing parser checks neither entity ID format nor unknown keys, so add both for these sections only.
- An `add` entry whose HA domain isn't one rooms use (eligible: `light`, `switch`, `fan`, `input_boolean`, `scene`, `script`, `media_player`, `cover`, `climate`, `lock`) is rejected with the path in the message (decided with the owner: drop and report, never show a button or sensor in a room). Export the eligible list from here so 007 uses the same one.
- `home.example.json` gets placeholder examples, including the example garage opener in `confirm`.
- `testHomeConfig.ts` gets exactly the values under "Shared placeholder house for rooms" in `_plan.md` (`hidden: ['storage']`, `awayRoom: 'garage'`, the `living_room` add/remove, `confirm: ['switch.garage_door_opener']`). 019's placeholder registries use the same area IDs, and demo mode runs on `testHomeConfig` itself (`DEMO_HOME_CONFIG` in `src/app/App.tsx`), so these values are a contract with 019 and 018, which run without depending on this task.
- `HomeConfig` gains required `rooms` and `confirm` fields, so every `HomeConfig` literal must set them (`testHomeConfig.ts`, `src/features/home/systems/SystemsCard.test.tsx`, `src/test/renderWithHome.tsx`, and any others `tsc -b` finds).

## Requirements (Test Descriptions)

- [x] `it parses hidden areas, per-area add and remove lists, and the away room`
- [x] `it defaults rooms to no hidden areas, no tweaks, and no away room when the section is absent`
- [x] `it parses the confirm list of entity ids and defaults it to empty`
- [x] `it rejects a malformed entity id in a room's add list with the path in the message`
- [x] `it rejects an unknown key in the rooms section`
- [x] `it rejects a room add entry whose HA domain rooms don't use`
- [x] `it parses home.example.json without errors`

## Acceptance Criteria

- All requirements have passing tests
- `home.example.json` documents both sections
- Code follows code standards
- No decrease in test coverage

## Implementation Notes
Added ROOM_DOMAINS and RoomsConfig exports in homeConfig.ts; rooms/confirm parsed strictly; testHomeConfig and home.example.json updated. Only testHomeConfig had a HomeConfig literal needing the fields (others spread it).
