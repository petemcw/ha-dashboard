# Task 012: Systems Card: CPU Usage Bars

**Status**: completed
**Depends on**: 001, 009, 011
**Retry count**: 0

## Description

Add CPU usage bars under the Systems stat tiles, one per entry in `systems.cpu`. Each bar shows the device label, a fill proportional to the percentage, and the percentage. Unavailable or missing sensors read as such instead of drawing an empty bar.

## Context

- Related files: `src/features/home/systems/` (from 011), `src/domains/sensor/` (`numericValue`), `src/index.css`, `e2e/systems.spec.ts`.
- Layout from the mock-up: a three-part grid row (a label of about 6.5 rem, a 5 px track, the value right-aligned), 10 px between rows, the fill in the ok color. Clamp values to 0–100.
- Expose the fill to assistive tech: render each bar as a `meter` (or `role="meter"` with `aria-valuenow/min/max` and an `aria-label` of "{label} CPU"), so the value isn't only visual.
- Unavailable or unknown sensors show "—" with no fill, and missing sensors show "Missing". Omit the whole block when `cpu` isn't set.

## Requirements (Test Descriptions)

- [x] `it shows a CPU bar for each configured device with its percentage`
- [x] `it exposes each CPU bar as a meter with its value`
- [x] `it shows a dash instead of a bar when a CPU sensor is unavailable`
- [x] `it shows no CPU bars when none are configured`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

- `systemsViewModel` now returns `cpu: CpuBar[]` (percent rounded and clamped 0-100; note "—" for unavailable/unknown/non-numeric, "Missing" for missing entities), built with `sensorViewModel`.
- `SystemsCard` renders a `role="group"` "CPU usage" block under the tiles; each bar is a `role="meter"` named "{label} CPU" with aria-valuenow/min/max. Unreadable sensors render no meter, only the note. Block omitted when `cpu` is unset or empty. CPU entity IDs added to the subscribed set.
- CSS: "Systems card: CPU bars" block (6.5rem / 1fr / auto grid, 5px track, 10px row gap, fill in `--ok`).
- e2e: `systems.spec.ts` seeds the CPU sensors and checks the meters; `home.spec.ts` gains the restored two-column fallback at 1180x820 (home config without `systems` and `media` via the mock's `homeConfig` option), alongside the three-column spec.
