import { mdiMusic } from '@mdi/js'
import { useState } from 'react'
import { Icon } from './icons/Icon'
import './Artwork.css'

// A media player's cover art, or a music note when there is none or it fails to load.
// Keyed by URL by the caller: every track brings a new entity_picture, and an old failure
// (a blocked http:// URL, an expired proxy token) must not hide the next track's artwork.
export function Artwork({ url }: { url?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="media-art">
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        <Icon path={mdiMusic} size={22} />
      )}
    </div>
  )
}
