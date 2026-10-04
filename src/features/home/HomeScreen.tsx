import { useEntitiesLoaded } from '../../infrastructure/entities/useEntity'
import { AttentionSection } from './attention/AttentionSection'
import { useAttention } from './attention/useAttention'
import { CryptoRow } from './crypto/CryptoRow'
import { FavoritesSection } from './favorites/FavoritesSection'
import { PresenceRow } from './presence/PresenceRow'
import { HouseSign } from './sign/HouseSign'
import { SuggestionsStrip } from './suggestions/SuggestionsStrip'

type HomeScreenProps = { onOpenSettings?: () => void }

// Each region is its own component in its own file, so tasks fill them in
// without touching this one.
export function HomeScreen({ onOpenSettings }: HomeScreenProps) {
  // Until HA sends the first entity map, no entity can be called missing.
  const loaded = useEntitiesLoaded()
  const attention = useAttention()
  return (
    <>
      <HouseSign
        loaded={loaded}
        urgent={attention.urgent}
        chores={attention.chores}
        onOpenSettings={onOpenSettings}
      />
      <main className="home">
        {/* The sign's greeting is the visible title; this names the page for assistive tech. */}
        <h1 className="visually-hidden">Home</h1>
        {loaded ? (
          <div className="home__grid">
            <div className="home__attention">
              <AttentionSection attention={attention} />
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
          <p className="home__connecting">Connecting…</p>
        )}
      </main>
    </>
  )
}
