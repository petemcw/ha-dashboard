# Feature decisions

What carries over from the Lovelace dashboard (`dashboard-home`), and how. Decided 2026-10-03 by walking through every card on that dashboard. Entity IDs here were checked against live HA on that date; `src/config/home.ts` becomes the source of truth once it exists.

## Release order

1. **v1: read-only home.** Attention, suggestions (shown, not tappable), presence, favorites (state only), crypto. No HA actions.
2. **Demo mode** (`?demo`, fake service gateway) so controls can be tested without touching the house.
3. **Controls**: tap actions on home, then rooms.

## Home screen

### Attention

Items that need action, at the top of home. Each rule is typed config with unit tests.

- **Left on/open**, shown only after a per-rule duration:
  - `binary_sensor.garage_door_status` (open). Its action toggles `switch.garage_door_switch_a0dd6c497c48`.
  - `switch.smart_plug_b725` (garage work lights)
  - `switch.space_heater`
  - `light.master_bedroom_bed_lightstrip`
- **Low battery**: any `sensor` with `device_class: battery` below a threshold, minus an ignore list. Today this would catch `sensor.front_porch_battery` and three bathroom air sensors, all at 0%.
- **Updates**: only specific entities: `update.living_room_switch_a0dd6c2bcf74_firmware` and `binary_sensor.docker_hub_update_available`. Open: whether `update.update_firmware` joins them.
- **Printer toner**: `sensor.family_room_printer_ink` below 15. Its action opens the reorder link. The sensor is often `unavailable`.
- **Filters due**: fewer than 5 days left on `sensor.hvac_filter_days_remaining`, `sensor.refrigerator_water_filter_days_remaining`, or `sensor.refrigerator_air_filter_days_remaining`. Their actions run `script.set_hvac_filter_replacement_date`, `script.reset_refrigerator_water_filter_replacement_date`, and `script.reset_refrigerator_air_filter_replacement_date`.

Behavior:

- **Severity tiers**: urgent items (left on/open) are large. Chores (batteries, filters, toner, updates) go in a compact row.
- **Snooze**: hold an item to snooze it for a set time. Snoozes are shared across devices and users, so they need storage in HA (see open questions).

### Suggestions

A separate strip from attention, so a suggestion never looks like a problem.

- `media_player.family_room_apple_tv` playing → `scene.family_room_off_during_tv` (5 s transition)
- Same player paused → `scene.family_room_on_during_tv_paused`

### Presence

A compact avatar row for all six `person` entities: photo or initials, a home/away dot, and the zone name when away. `person.casey_rivera` has no trackers and shows `unknown`.

### Favorites

- Each user picks and manages their own favorites list. The phone knows the user from the OAuth login, mapped to a `person` through its `user_id`.
- The kiosk logs in as a shared user and has its own household list, managed the same way.
- Seed list (today's): `light.living_room_switch_a0dd6c2bcf74_helper`, `light.kitchen_lamp`, `light.entry_lamp`, `switch.smart_plug_b8a9` (Christmas tree), `light.dads_lamp_bedroom`, `light.master_bedroom_bed_lightstrip`, `light.family_room_accent_lights`, `switch.space_heater`.

### Crypto

One compact row: `sensor.btc_exchange_rate`, `sensor.eth_exchange_rate`, `sensor.sol_exchange_rate`, each with price, 24 h change, and a sparkline from HA history.

### Dropped (may return later)

Weather forecast, filter days-left list, sunrise/sunset badges, greeting.

## Rooms (after v1)

- **Rooms are HA areas.** HA has 29 areas, with floor prefixes in the IDs; areas with nothing to control are hidden.
- **Which room shows is chosen per user or device**, not by a global helper. It's manual first, behind a room-source interface, so automatic sources can be added later. The candidates:
  - occupancy sensors (only `binary_sensor.master_bedroom_p1_occupancy` and `binary_sensor.laundry_p1_occupancy` exist; they don't say who is there)
  - the UniFi AP a phone is connected to (`ap_mac`; 5 APs, coarse, affected by private Wi-Fi MACs)
  - BLE room tracking (Bermuda), which would need new hardware
- `input_select.room_select` isn't used by any automation, so the new app ignores it.
- **Lights**: tap toggles, drag sets brightness. A detail sheet holds color temp and color.
- **Media**: now playing, transport, and volume for `media_player.living_room_speaker` and `media_player.family_room_apple_tv`.
- **No hidden gestures.** The master bedroom fan (`fan.master_bedroom_switch`, a double-tap today) gets its own visible control.
- The Lovelace Garage view becomes the Garage area.

## Visual style

Light and dark modes, built on design tokens. The palette and theme aren't decided yet.

## Open questions

- Shared storage for snoozes: an HA helper or something else. Creating a helper is a write to HA, so ask first.
- Per-user favorites storage: check that HA's per-user frontend data (`frontend/get_user_data` / `frontend/set_user_data`) is available on 2026.9 and fits.
- Thresholds: the duration for each left-on rule, and the battery cutoff.
- Theme and color palette.
