# Feature decisions

What carries over from the Lovelace dashboard (`dashboard-home`), and how. Decided 2026-10-03 by walking through every card on that dashboard. The repo is public, so this file describes rules by kind and names no entities. The owner's `home.json` (shape: `home.example.json`) holds the real entity IDs.

## Release order

1. **v1: read-only home.** Attention, suggestions (shown, not tappable), presence, favorites (state only), crypto. No HA actions. **Shipped (v1):** all five regions, snoozes shared via HA system data, per-user favorites with an editor, kiosk token entry, and reconnect handling.
2. **Demo mode** (`?demo`, real gateway over a shared fake HA) so controls can be tested without touching the house. **Shipped.**
3. **Controls**: tap actions on home, then rooms. **Shipped (home):** rooms are still to come.

## Home screen

### Attention

Items that need action, at the top of home. Each rule is typed config with unit tests.

- **Left on/open**, shown only after a per-rule duration:
  - the garage door sensor (open). Its action toggles the opener switch, a different entity from the sensor.
  - a smart plug for work lights
  - a space heater switch
  - a bedroom lightstrip
- **Low battery**: any `sensor` with `device_class: battery` below a threshold, minus an ignore list. At decision time it would have caught four sensors, all at 0%.
- **Updates**: only a listed set of `update` and update-available `binary_sensor` entities, not every update in HA. Open: whether a third firmware entity joins them.
- **Printer toner**: the printer's ink sensor below 15. Its action opens the reorder link. The sensor is often `unavailable`.
- **Filters due**: fewer than 5 days left on any of three filter days-remaining sensors (HVAC and two refrigerator filters). Each filter's action runs its own reset script.

Behavior:

- **Severity tiers**: urgent items (left on/open) are large. Chores (batteries, filters, toner, updates) go in a compact row.
- **Snooze**: hold an item to snooze it for a set time. Snoozes are shared across devices and users, so they need storage in HA (see open questions).

### Suggestions

A separate strip from attention, so a suggestion never looks like a problem.

- The TV media player playing → a lights-down scene (5 s transition)
- Same player paused → a lights-up scene

### Presence

A compact avatar row for every `person` entity: photo or initials, a home/away dot, and the zone name when away. A person with no trackers shows `unknown`.

### Favorites

- Each user picks and manages their own favorites list. The phone knows the user from the OAuth login, mapped to a `person` through its `user_id`.
- The kiosk logs in as a shared user and has its own household list, managed the same way.
- Seed list: the household's everyday lights and plugs (eight entities at decision time), kept in `home.json`, not here.

### Crypto

One compact row of exchange-rate sensors (BTC, ETH, SOL), each with price, 24 h change, and a sparkline from HA history.

### Dropped (may return later)

Weather forecast, filter days-left list, sunrise/sunset badges, greeting.

## Rooms (after v1)

- **Rooms are HA areas.** Area IDs carry floor prefixes; areas with nothing to control are hidden.
- **Which room shows is chosen per user or device**, not by a global helper. It's manual first, behind a room-source interface, so automatic sources can be added later. The candidates:
  - occupancy sensors (only two rooms have one, and they don't say who is there)
  - the UniFi AP a phone is connected to (`ap_mac`; coarse, affected by private Wi-Fi MACs)
  - BLE room tracking (Bermuda), which would need new hardware
- The existing room-select helper isn't used by any automation, so the new app ignores it.
- **Lights**: tap toggles, drag sets brightness. A detail sheet holds color temp and color.
- **Media**: now playing, transport, and volume for the speaker and TV media players.
- **No hidden gestures.** A bedroom fan that is a double-tap on a switch today gets its own visible control.
- The Lovelace Garage view becomes the Garage area.

## Visual style

Light and dark modes, built on design tokens. The palette and theme aren't decided yet.

## Open questions

- Shared storage for snoozes: an HA helper or something else. Creating a helper is a write to HA, so ask first.
- Per-user favorites storage: check that HA's per-user frontend data (`frontend/get_user_data` / `frontend/set_user_data`) is available on 2026.9 and fits.
- Thresholds: the duration for each left-on rule, and the battery cutoff.
- Theme and color palette.
