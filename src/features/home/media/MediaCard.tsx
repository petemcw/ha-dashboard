import { mdiMusic, mdiVolumeHigh, mdiVolumeOff } from '@mdi/js'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { useEntitiesById } from '../../../infrastructure/entities/useEntitiesById'
import { useHaUrl } from '../../../infrastructure/ha/useHaUrl'
import { Artwork } from '../../shared/Artwork'
import { Chip } from '../../shared/Chip'
import { Icon } from '../../shared/icons/Icon'
import { SectionCard } from '../../shared/SectionCard'
import { mediaCardViewModel } from './mediaViewModel'
import './MediaCard.css'

function MediaCardContent({ players }: { players: string[] }) {
  const haUrl = useHaUrl()
  const entities = useEntitiesById(players)
  const { featured, chips, playingCount } = mediaCardViewModel(
    players.map((id) => mediaPlayerViewModel(entities[id], id, haUrl)),
  )
  const volumePath = featured?.muted ? mdiVolumeOff : mdiVolumeHigh
  return (
    <SectionCard
      title="Media"
      icon={mdiMusic}
      className="media-card"
      chip={
        playingCount > 0 ? (
          <Chip tone="leaf" variant="outline">
            {playingCount} playing
          </Chip>
        ) : undefined
      }
    >
      {featured ? (
        <>
          <div className="media-now">
            <Artwork key={featured.artworkUrl ?? ''} url={featured.artworkUrl} />
            <div className="media-now__text">
              <div className="media-now__title">{featured.title ?? 'Unknown title'}</div>
              {featured.artist && <div className="media-now__artist">{featured.artist}</div>}
              <div className="media-now__room">
                <Icon path={mdiVolumeHigh} size={12} />
                {featured.room}
              </div>
            </div>
          </div>
          {featured.volumePercent !== undefined && (
            <div className="media-volume">
              <Icon path={volumePath} size={16} />
              <div
                role="meter"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={featured.volumePercent}
                aria-valuetext={featured.muted ? 'Muted' : `${featured.volumePercent}%`}
                className="media-volume__bar"
              >
                <span style={{ width: `${featured.volumePercent}%` }} />
              </div>
              <span className="media-volume__value">{featured.volumePercent}</span>
            </div>
          )}
        </>
      ) : (
        <p className="media-empty">Nothing playing</p>
      )}
      {chips.length > 0 && (
        <ul className="media-players">
          {chips.map((c) => (
            <Chip key={c.entity_id} as="li" variant="outline">
              {c.label}
            </Chip>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

// Display-only: no transport controls, those are a later plan.
export function MediaCard() {
  const media = useHomeConfig().media
  return media ? <MediaCardContent players={media.players} /> : null
}
