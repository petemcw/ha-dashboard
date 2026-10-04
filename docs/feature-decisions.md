# Feature decisions

What carries over from the Lovelace dashboard (`dashboard-home`), and how. Decided 2026-10-03 by walking through every card on that dashboard. The repo is public, so this file describes rules by kind and names no entities. The owner's `home.json` (shape: `home.example.json`) holds the real entity IDs.

## Release order

1. **v1: read-only home.** Attention, suggestions (shown, not tappable), presence, favorites (state only), crypto. No HA actions. **Shipped:** all five regions, snoozes shared via HA system data, per-user favorites with an editor, kiosk token entry, and reconnect handling.
2. **Demo mode** (`?demo`, real gateway over a shared fake HA) so controls can be tested without touching the house. **Shipped.**
3. **Controls**: tap actions on home, then rooms, then a media viewer with controls. **Shipped (home):** favorites, suggestions, and attention actions are live. Rooms and media controls are still to come.
4. **Home redesign**: slim sticky header, card grid, one-line attention rows with icon actions, light/dark toggle, and display-only Today, Systems, and Media cards. **Shipped.**
5. **Favorites editor**: improve the user interface and experience for managing personal favorites, including adding, removing, and reordering items.
6. **Dynamic suggestions**: provide context-aware recommendations based on current home state, such as adjusting lights or climate settings.
7. **YouVersion Bible verse of the day**: replace the generic greeting with a daily Bible verse; collapse to the reference on mobile.

## Home screen

A grid of cards under a slim sticky header: three columns on a landscape tablet, two in portrait, one on a phone (attention, suggestions, favorites, Today, Systems, Media, crypto).

### Header

Time-of-day greeting, presence avatars, a large clock and date, Settings, and a one-tap light/dark toggle. The settings sheet keeps a "System" theme option.

### Attention

Items that need action, at the top of home. Each rule is typed config with unit tests.

- **Left on/open**, shown only after a per-rule duration. Each rule picks its icon in `home.json`.
  - the garage door sensor (open). Its action toggles the opener switch, a different entity from the sensor, with a two-tap confirm.
  - a smart plug for work lights
  - a space heater switch
  - a bedroom lightstrip
- **Low battery**: any `sensor` with `device_class: battery` below a threshold, minus an ignore list. At decision time it would have caught four sensors, all at 0%.
- **Updates**: only a listed set of `update` and update-available `binary_sensor` entities, not every update in HA. Open: whether a third firmware entity joins them.
- **Printer toner**: the printer's ink sensor below 15. Its action opens the reorder link. The sensor is often `unavailable`.
- **Filters due**: fewer than 5 days left on any of three filter days-remaining sensors (HVAC and two refrigerator filters). "Mark replaced" (two-tap confirm) runs that filter's reset script.

Behavior:

- **One row per item**: icon badge, what it is, and icon actions on the right. Urgent items (left on/open) get a red badge; chores (batteries, filters, toner, updates) get an ochre one. A count chip sums them ("2 urgent · 2 chores").
- **Two-tap confirm**: the first tap slides the icon aside and shows "Confirm?"; the second sends. Tapping elsewhere or waiting a few seconds disarms it.
- **Snooze**: a clock icon opens "1 day · 1 week · Cancel". Snoozes are shared across devices and users through HA system data.
- **Empty states**: with nothing to show the card disappears. If items are snoozed, a "N snoozed" strip takes its place and can be expanded to unsnooze.

### Suggestions

A separate strip from attention, so a suggestion never looks like a problem. Each button activates a scene, with an optional transition.

- The TV media player playing → a lights-down scene (5 s transition)
- Same player paused → a lights-up scene

### Presence

Avatars in the header for every `person` entity (or the `people` list in `home.json`): photo or initials, a home/away dot, and the zone name when away. A person with no trackers shows `unknown`.

### Favorites

- Each user picks and manages their own favorites list. The phone knows the user from the OAuth login, mapped to a `person` through its `user_id`.
- The kiosk logs in as a shared user and has its own household list, managed the same way.
- Seed list: the household's everyday lights and plugs (eight entities at decision time), kept in `home.json`, not here.
- Tiles show an icon for what they control, highlighted when on. Lights, switches, and fans toggle; scenes activate; scripts run. Media players, covers, climate, and locks are display-only.
- The editor lives in the settings sheet: search to add, remove with undo, and move up.

### Today, Systems, Media

Display-only cards, each shown only when its section exists in `home.json`.

- **Today**: current temperature, condition, high/low, humidity, wind, UV, the next several hours of forecast, and sunset. The forecast refreshes on its own and after a reconnect, and keeps the last good data if a refresh fails.
- **Systems**: a status chip from a configured entity, gateway uptime, access points online, last backup, pending updates, and CPU bars for the gateway and access points.
- **Media**: the playing player first with what's on and the volume, the rest as chips, and an "N playing" chip.

### Crypto

One compact row of exchange-rate sensors (BTC, ETH, SOL), each with price, 24 h change, and a sparkline from HA history.

### Dropped (may return later)

Filter days-left list, sunrise badge.

## Rooms

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

Light and dark modes, built on design tokens, in the Maple Frontier timber palette with Zilla Slab headings. Icons come from Lucide, imported by name.

## Open questions

- Can we use MDI home automation icons instead of or in addition to Lucide? Lucide has no garage glyph (a warehouse stands in), and HA entities already carry `mdi:` icon names.
