# Task 010: Demo House Seed and Demo Controls

**Status**: pending
**Issue**: #27
**Depends on**: 001, 002, 004, 005, 006, 009
**Retry count**: 0

## Description

Fill demo mode with a house worth tapping: every Home section has something to show, favorites are pre-seeded, and the fake HA answers HA actions after a short delay so the pending state is visible. A tap in demo changes the demo house the same way it would change the real one.

## Context

- Related files:
  - New: `src/app/demo/demoHouse.ts` (+ test): entities built from domain factories and `calmHouse()`, the favorites user data, and crypto statistics
  - Modify: `src/infrastructure/fakeHa/fakeHa.ts` (a `responseDelayMs` option for `call_service` results and the state changes they cause; an `onServiceCall` effects hook, see below), the demo wiring from task 009 (seed the core with `demoHouse`), `e2e/demo.spec.ts`
  - Reference: `src/features/home/attention/factories.ts` (`calmHouse`), `src/domains/*/factories.ts`, `src/config/testHomeConfig.ts`, `src/features/home/favorites/favoritesValue.ts` (`FAVORITES_KEY` and value shape), `src/infrastructure/ha/statistics.ts` (shape the crypto row reads)
- The demo house is generic placeholder data only: no names, entity IDs, or details from the real house (public repo).
- The seed lives in `src/app/demo/` because infrastructure must not import domains or features.
- The demo house should include: the garage door open past its rule's minutes, the space heater on, one filter due, one low battery, the suggestion player `playing`, a few `person` entities (home and away), favorites with at least a light, a switch, a fan, a scene, and a script, and crypto sensors with statistics.
- Fan, scene, and script factories come from tasks 005 and 006 (both are dependencies).
- **Every action target exists (review I4/I8).** The fake HA answers `not_found` for an entity it doesn't have, so the demo house includes every entity a control targets: `switch.garage_door_opener`, both suggestion scenes, both filter reset scripts, and the favorites.
- **Demo taps visibly change the house (review I8).** On its own, toggling the opener switch doesn't touch `binary_sensor.garage_door`, and `script.turn_on` changes nothing, so "Close garage door" and "Mark replaced" would look broken in demo (story 28). Add a core option `onServiceCall(call, house)` that returns or applies extra state changes. The demo house uses it so the opener toggle closes the door sensor and a reset script moves its filter's days-remaining sensor back above the threshold, both after the response delay. The Playwright mock leaves it unset.
- When the delay is set, the order stays: the state change(s) first, then the result, both after the delay.
- Demo `person` entities have no `entity_picture`, so the presence row shows initials and makes no picture request (see task 009's `useHaUrl` demo branch).
- About 600 ms of delay is enough to see pending without feeling broken.

## Requirements (Test Descriptions)

- [ ] `the demo house shows at least one urgent attention item and one chore`
- [ ] `the demo house seeds favorites with a light, a switch, a fan, a scene, and a script`
- [ ] `the demo house plays the suggestion player so a suggestion shows`
- [ ] `the fake HA delays the call_service result by the configured delay`
- [ ] `a light tap in demo mode turns the demo light on after the delay`
- [ ] `the demo house contains every entity a demo control targets`
- [ ] `toggling the demo garage opener closes the demo garage door sensor`
- [ ] `running a demo filter reset script clears that filter's chore`
- [ ] `demo people have no pictures`

## Acceptance Criteria

- All requirements have passing tests
- `e2e/demo.spec.ts` taps a favorite light in `/?demo` and sees it turn on, with no request to the HA origin
- Phone and tablet screenshots of `/?demo` checked
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
