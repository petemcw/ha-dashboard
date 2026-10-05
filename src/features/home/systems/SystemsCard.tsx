import { mdiWifi } from '@mdi/js'
import { memo, useMemo } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { useNow } from '../../../infrastructure/clock/clock'
import { useEntitiesById } from '../../../infrastructure/entities/useEntitiesById'
import { useEntityIds } from '../../../infrastructure/entities/useEntityIds'
import { Chip } from '../../shared/Chip'
import { SectionCard } from '../../shared/SectionCard'
import { systemsEntityIds, systemsViewModel } from './systemsViewModel'
import './SystemsCard.css'

// Every update entity, whatever the integration: the count is of the house, not a list.
const isUpdate = (e: HassEntity) => e.entity_id.startsWith('update.')

function SystemsCardContent() {
  const { systems } = useHomeConfig()
  const now = useNow()
  const configuredIds = useMemo(() => (systems ? systemsEntityIds(systems) : []), [systems])
  const entities = useEntitiesById(configuredIds)
  const updates = useEntitiesById(useEntityIds(isUpdate))
  if (!systems) return null

  const { chip, tiles, cpu } = systemsViewModel(systems, entities, updates, now)
  return (
    <SectionCard
      title="Systems"
      icon={mdiWifi}
      className="systems"
      chip={
        <Chip tone={chip.tone} dot>
          {chip.text}
        </Chip>
      }
    >
      <div className="stat-tiles">
        {tiles.map((t) => (
          <div key={t.key} role="group" aria-label={t.key} className="stat">
            <span className="stat__k" aria-hidden="true">
              {t.key}
            </span>
            <span className="stat__v">
              {t.value}
              {t.unit && <small>{t.unit}</small>}
            </span>
            <span className="stat__s">{t.sub}</span>
          </div>
        ))}
      </div>
      {cpu.length > 0 && (
        <div role="group" aria-label="CPU usage" className="cpu">
          {cpu.map((c) => (
            <div key={c.key} className="cpu__row">
              <span className="cpu__label">{c.label}</span>
              {c.percent === undefined ? (
                <span className="cpu__note">{c.note}</span>
              ) : (
                <>
                  <span
                    role="meter"
                    aria-label={`${c.label} CPU`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={c.percent}
                    className="cpu__track"
                  >
                    <span className="cpu__fill" style={{ width: `${c.percent}%` }} />
                  </span>
                  <span className="cpu__value">{c.percent}%</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// Reads the clock and update entities itself, so the rest of the screen doesn't re-render.
export const SystemsCard = memo(SystemsCardContent)
