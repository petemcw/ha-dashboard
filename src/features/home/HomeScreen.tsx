import { useEntitiesLoaded } from '../../infrastructure/entities/useEntity'
import { AttentionSection } from './attention/AttentionSection'
import { CryptoRow } from './crypto/CryptoRow'
import { FavoritesSection } from './favorites/FavoritesSection'
import { PresenceRow } from './presence/PresenceRow'
import { SuggestionsStrip } from './suggestions/SuggestionsStrip'

type HomeScreenProps = { onOpenSettings?: () => void }

// Each region is its own component in its own file, so tasks fill them in
// without touching this one.
export function HomeScreen({ onOpenSettings }: HomeScreenProps) {
  // Until HA sends the first entity map, no entity can be called missing.
  const loaded = useEntitiesLoaded()
  return (
    <main className="home">
      <h1>Home</h1>
      {loaded ? (
        <div className="home__grid">
          <div className="home__attention">
            <AttentionSection />
          </div>
          <div className="home__suggestions">
            <SuggestionsStrip />
          </div>
          <div className="home__presence">
            <PresenceRow />
          </div>
          <div className="home__favorites">
            <FavoritesSection onOpenSettings={onOpenSettings} />
          </div>
          <div className="home__crypto">
            <CryptoRow />
          </div>
        </div>
      ) : (
        <p>Connecting…</p>
      )}
    </main>
  )
}
