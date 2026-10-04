import type { HassEntity } from 'home-assistant-js-websocket'
import type { SystemsConfig } from '../../../config/homeConfig'
import { entityStatus } from '../../../domains/entityStatus'
import { sensorViewModel } from '../../../domains/sensor/viewModel'
import { updateViewModel } from '../../../domains/update/viewModel'
import { formatClock } from '../formatClock'

export type StatusChip = { tone: 'ok' | 'danger' | 'neutral'; text: string }
export type StatTile = { key: string; value: string; unit?: string; sub: string }
// `percent` is clamped to 0-100 and absent when the sensor can't be read.
export type CpuBar = { key: string; label: string; percent?: number; note?: string }
export type SystemsViewModel = { chip: StatusChip; tiles: StatTile[]; cpu: CpuBar[] }

type Entities = Record<string, HassEntity | undefined>

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

// The state text when HA has a usable value; unavailable, unknown, and missing give none.
const okState = (entity: HassEntity | undefined) =>
  entityStatus(entity) === 'ok' ? entity?.state : undefined

// Every configured entity the card reads, so the container subscribes to exactly these.
export function systemsEntityIds(config: SystemsConfig): string[] {
  return [
    config.status.entity_id,
    ...(config.uptime ? [config.uptime.entity_id] : []),
    ...(config.accessPoints?.entity_ids ?? []),
    ...(config.backup ? [config.backup] : []),
    ...(config.cpu ?? []).map((c) => c.entity_id),
  ]
}

function statusChip(config: SystemsConfig['status'], entity: HassEntity | undefined): StatusChip {
  const { label, upState } = config
  const status = entityStatus(entity)
  if (status === 'missing') return { tone: 'neutral', text: `${label} missing` }
  if (status !== 'ok') return { tone: 'neutral', text: `${label} unknown` }
  return okState(entity) === upState
    ? { tone: 'ok', text: `${label} online` }
    : { tone: 'danger', text: `${label} offline` }
}

// The uptime sensor's state is the boot time, so the duration is computed against the
// shared clock and keeps moving without a state change.
function uptimeTile(
  config: NonNullable<SystemsConfig['uptime']>,
  entity: HassEntity | undefined,
  now: Date,
): StatTile {
  const elapsed = now.getTime() - Date.parse(okState(entity) ?? '')
  const base = { key: 'Uptime', sub: config.label }
  if (!Number.isFinite(elapsed) || elapsed < 0) return { ...base, value: 'Unknown' }
  return elapsed >= DAY_MS
    ? { ...base, value: String(Math.floor(elapsed / DAY_MS)), unit: 'd' }
    : { ...base, value: String(Math.floor(elapsed / HOUR_MS)), unit: 'h' }
}

function accessPointsTile(
  config: NonNullable<SystemsConfig['accessPoints']>,
  entities: Entities,
): StatTile {
  // A missing AP is not up, so it counts against the total.
  const up = config.entity_ids.filter((id) => entities[id]?.state === config.upState).length
  return {
    key: 'Access points',
    value: String(up),
    unit: `/${config.entity_ids.length}`,
    sub: 'Online',
  }
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

function backupTile(entity: HassEntity | undefined, now: Date): StatTile {
  const key = 'Last backup'
  const at = new Date(okState(entity) ?? NaN)
  if (Number.isNaN(at.getTime())) return { key, value: 'Unknown', sub: '' }
  const daysAgo = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS)
  const value =
    daysAgo === 0
      ? 'Today'
      : daysAgo === 1
        ? 'Yesterday'
        : at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { key, value, sub: formatClock(at) }
}

function updatesTile(updates: Entities): StatTile {
  const ready = Object.entries(updates).filter(([id, e]) => updateViewModel(id, e).isPending).length
  return {
    key: 'Updates',
    value: String(ready),
    sub: ready === 0 ? 'Up to date' : 'Ready to install',
  }
}

function cpuBar(label: string, entityId: string, entity: HassEntity | undefined): CpuBar {
  const { status, numericValue } = sensorViewModel(entityId, entity)
  const key = entityId
  if (status === 'missing') return { key, label, note: 'Missing' }
  if (numericValue === undefined) return { key, label, note: '—' }
  return { key, label, percent: Math.min(100, Math.max(0, Math.round(numericValue))) }
}

// `entities` holds the configured entities by ID; `updates` every update.* entity.
export function systemsViewModel(
  config: SystemsConfig,
  entities: Entities,
  updates: Entities,
  now: Date,
): SystemsViewModel {
  const tiles: (StatTile | undefined)[] = [
    config.uptime && uptimeTile(config.uptime, entities[config.uptime.entity_id], now),
    config.accessPoints && accessPointsTile(config.accessPoints, entities),
    config.backup ? backupTile(entities[config.backup], now) : undefined,
    updatesTile(updates),
  ]
  return {
    chip: statusChip(config.status, entities[config.status.entity_id]),
    tiles: tiles.filter((t): t is StatTile => t !== undefined),
    cpu: (config.cpu ?? []).map((c) => cpuBar(c.label, c.entity_id, entities[c.entity_id])),
  }
}
