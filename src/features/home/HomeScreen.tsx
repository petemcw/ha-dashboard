import type { ReactNode } from 'react'
import { useEntitiesLoaded } from '../../infrastructure/entities/useEntity'
import { AttentionSection } from './attention/AttentionSection'
import { useAttention } from './attention/useAttention'
import { CryptoRow } from './crypto/CryptoRow'
import { FavoritesSection } from './favorites/FavoritesSection'
import { MediaCard } from './media/MediaCard'
import { PresenceRow } from './presence/PresenceRow'
import { HeaderBar } from './header/HeaderBar'
import { SuggestionsStrip } from './suggestions/SuggestionsStrip'
import { TodaySection } from './today/TodaySection'
import { SystemsCard } from './systems/SystemsCard'

type HomeScreenProps = {
  onOpenSettings?: () => void
  // Opens the favorites editor, from the Favorites card's Edit and Add favorites buttons.
  onEditFavorites?: () => void
  // Header buttons shown before Settings; AppShell supplies the theme toggle.
  tools?: ReactNode
}

// Each region is its own component in its own file.
export function HomeScreen({ onOpenSettings, onEditFavorites, tools }: HomeScreenProps) {
  // Until HA sends the first entity map, no entity can be called missing.
  const loaded = useEntitiesLoaded()
  const attention = useAttention()
  return (
    <>
      <HeaderBar
        onOpenSettings={onOpenSettings}
        tools={tools}
        // Before the first entity map, listed people would all read as missing.
        people={loaded ? <PresenceRow /> : null}
      />
      <main className="home">
        {/* The header's greeting isn't a title; this names the page for assistive tech. */}
        <h1 className="visually-hidden">Home</h1>
        {loaded ? (
          // Three stacks that reflow like Home Assistant sections: one column on phones, two
          // on tablets (favorites on the right), three once column 3 has a card. Each
          // wrapper carries its phone order, since the stacks dissolve below 740 px.
          <div className="home__grid">
            <div className="home__col home__col--1">
              <div className="home__order--attention">
                <AttentionSection attention={attention} />
              </div>
              <div className="home__order--suggested">
                <SuggestionsStrip />
              </div>
              <div className="home__order--crypto">
                <CryptoRow />
              </div>
            </div>
            <div className="home__col home__col--2">
              <div className="home__order--favorites">
                <FavoritesSection onEditFavorites={onEditFavorites} />
              </div>
              <div className="home__order--today">
                <TodaySection />
              </div>
            </div>
            {/* A card that isn't configured leaves its wrapper empty; with both empty the
                column takes no space and the layout stays at two columns. */}
            <div className="home__col home__col--3">
              <div className="home__order--systems">
                <SystemsCard />
              </div>
              <div className="home__order--media">
                <MediaCard />
              </div>
            </div>
          </div>
        ) : (
          <p className="home__connecting">Connecting…</p>
        )}
      </main>
    </>
  )
}
