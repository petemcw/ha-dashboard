# Task 012: Systems Card: CPU Usage Bars

**Status**: pending
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

- [ ] `it shows a CPU bar for each configured device with its percentage`
- [ ] `it exposes each CPU bar as a meter with its value`
- [ ] `it shows a dash instead of a bar when a CPU sensor is unavailable`
- [ ] `it shows no CPU bars when none are configured`

## Acceptance Criteria

- All requirements have passing tests
- Code follows code standards
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
