# Task 010: Crypto row with 24-hour sparkline

**Status**: completed
**Depends on**: 001, 003
**Retry count**: 0

## Description

One compact row with BTC, ETH, and SOL: current price, 24-hour change, and a small trend line. The price comes live from the entity; the trend and the 24-hour baseline come from HA's long-term statistics.

## Context

- Related files: `src/config/home.ts` (`crypto`), `src/features/home/HomeScreen.tsx` (crypto region), `src/domains/sensor/` (may not exist yet; if not, keep the price parsing local to this feature's view model and don't create `src/domains/sensor/`, which task 006 owns)
- New: `src/infrastructure/ha/statistics.ts` + `useHourlyMeans(statisticIds, hours)`, `src/features/home/crypto/` (`cryptoViewModel.ts`, `Sparkline.tsx` as inline SVG, `CryptoRow.tsx`).
- Statistics call (checked live on 2026.9.4): `{ type: 'recorder/statistics_during_period', start_time, end_time, statistic_ids, period: 'hour', types: ['mean'] }` → `{ [statistic_id]: [{ start, end, mean }] }`, timestamps in ms, about 23 points per 24 h. Refetch every 15 minutes and after a reconnect; don't poll entity state (that's live from the store).
- View model per coin: `{ symbol, price, changePercent, points }`. Price from the entity state (`unit_of_measurement: USD`), formatted with `Intl.NumberFormat` (USD; whole dollars for BTC/ETH, cents for SOL). Change = (current price − first point's mean) / first mean. Points = hourly means plus the current price as the last point.
- `unavailable`/`unknown` price → "—" with no change; no statistics → price only, no sparkline; missing entity → missing state.
- Change has a sign and text, not just color ("+1.2%" / "−0.8%"). The sparkline is decorative (`aria-hidden`); the row's accessible text carries the numbers.

## Requirements (Test Descriptions)

- [x] `it shows each coin's current price in US dollars`
- [x] `it computes the 24-hour change from the oldest hourly mean`
- [x] `it appends the live price as the last sparkline point`
- [x] `it shows a dash and no change while the price is unavailable`
- [x] `it shows the price without a sparkline when there are no statistics`
- [x] `it updates the price when the entity changes without refetching statistics`

## Acceptance Criteria

- All requirements have passing tests (one Playwright mock spec in `e2e/crypto.spec.ts` seeds statistics)
- Coverage ≥ 80% for `src/infrastructure/ha/statistics.ts`
- Code follows code standards

## Implementation Notes

- `src/infrastructure/ha/statistics.ts` (`fetchHourlyMeans`, skips null means and empty series) and `useHourlyMeans.ts` (refetch every 15 min and on the connection `ready` event; keeps last series on failure; `connect` param defaults to `getConnection` for tests).
- `src/features/home/crypto/`: `cryptoViewModel.ts` (price, signed change with U+2212 minus, points, missing), `Sparkline.tsx` (aria-hidden SVG), `CryptoRow.tsx`. Statistic ids are the entity ids from `config/home.ts`.
- Tests: view model, row component (connection module mocked at the edge), statistics/hook, and `e2e/crypto.spec.ts` (phone and tablet, mocked). No edits to read-only files; `src/domains/sensor/` not created.
- Price parsing is local to the view model, per task note.
