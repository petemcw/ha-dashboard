import { Music, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { useEntitiesById } from '../../../infrastructure/entities/useEntitiesById'
import { useHaUrl } from '../../../infrastructure/ha/useHaUrl'
import { SectionCard } from '../SectionCard'
import { mediaCardViewModel } from './mediaViewModel'

// Keyed by URL by the caller: every track brings a new entity_picture, and an old failure
// (a blocked http:// URL, an expired proxy token) must not hide the next track's artwork.
function Artwork({ url }: { url?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="media-art">
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        <Music size={22} aria-hidden="true" />
      )}
    </div>
  )
}

function MediaCardContent({ players }: { players: string[] }) {
  const haUrl = useHaUrl()
  const entities = useEntitiesById(players)
  const { featured, chips, playingCount } = mediaCardViewModel(
    players.map((id) => mediaPlayerViewModel(entities[id], id, haUrl)),
  )
  const VolumeIcon = featured?.muted ? VolumeX : Volume2
  return (
    <SectionCard
      title="Media"
      icon={Music}
      className="media-card home__order--media"
      chip={
        playingCount > 0 ? (
          <span className="media-chip media-chip--leaf">{playingCount} playing</span>
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
                <Volume2 size={12} aria-hidden="true" />
                {featured.room}
              </div>
            </div>
          </div>
          {featured.volumePercent !== undefined && (
            <div className="media-volume">
              <VolumeIcon size={16} aria-hidden="true" />
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
            <li key={c.entity_id} className="media-chip">
              {c.label}
            </li>
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
