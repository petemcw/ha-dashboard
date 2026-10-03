import type { Connection } from 'home-assistant-js-websocket'

type StatisticRow = { start: number; end: number; mean: number | null }

const HOUR_MS = 3_600_000

// Hourly means per statistic id, oldest first. Ids without statistics are omitted.
export async function fetchHourlyMeans(
  conn: Connection,
  statisticIds: string[],
  hours: number,
  now: number = Date.now(),
): Promise<Record<string, number[]>> {
  const result = await conn.sendMessagePromise<Record<string, StatisticRow[]>>({
    type: 'recorder/statistics_during_period',
    start_time: new Date(now - hours * HOUR_MS).toISOString(),
    end_time: new Date(now).toISOString(),
    statistic_ids: statisticIds,
    period: 'hour',
    types: ['mean'],
  })
  const means: Record<string, number[]> = {}
  for (const [id, rows] of Object.entries(result)) {
    // An hour with no samples reports a null mean; skip it rather than draw a zero.
    const values = rows.flatMap((r) => (r.mean === null ? [] : [r.mean]))
    if (values.length > 0) means[id] = values
  }
  return means
}
