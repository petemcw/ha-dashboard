import { describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { sensorState } from '../../../domains/sensor/factories'
import { systemsViewModel } from './systemsViewModel'

const config = testHomeConfig.systems!
// Local times, so the day boundaries don't depend on the machine's zone.
const NOW = new Date(2026, 9, 4, 12, 0)

function backupTile(at: Date, locale: string) {
  const entities = {
    [config.backup!]: sensorState({ entity_id: config.backup!, state: at.toISOString() }),
  }
  return systemsViewModel(config, entities, {}, NOW, locale).tiles.find(
    (t) => t.key === 'Last backup',
  )
}

describe('systems view model', () => {
  it('dates an older backup in the given locale', () => {
    const at = new Date(2026, 8, 20, 9, 0)
    expect(backupTile(at, 'en-US')?.value).toBe('Sep 20')
    // Day first, as en-GB writes it.
    expect(backupTile(at, 'en-GB')?.value).toMatch(/^20 Sep/)
  })

  it('times the last backup in the given locale', () => {
    const at = new Date(2026, 9, 4, 21, 10)
    expect(backupTile(at, 'en-US')?.sub).toBe('9:10 pm')
    expect(backupTile(at, 'de-DE')?.sub).toBe('21:10')
  })

  it('gives each tile its unit text, spaced after a count and joined to a fraction', () => {
    const booted = new Date(NOW.getTime() - 19 * 86_400_000 - 3_600_000)
    const entities = {
      [config.uptime!.entity_id]: sensorState({
        entity_id: config.uptime!.entity_id,
        state: booted.toISOString(),
      }),
    }
    const { tiles } = systemsViewModel(config, entities, {}, NOW, 'en-US')
    const tile = (key: string) => tiles.find((t) => t.key === key)
    expect(tile('Uptime')).toMatchObject({ value: '19', unit: ' d' })
    expect(tile('Access points')).toMatchObject({ value: '0', unit: '/4' })
  })
})
