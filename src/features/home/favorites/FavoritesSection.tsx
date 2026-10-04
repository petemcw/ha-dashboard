import { Star } from 'lucide-react'
import { memo } from 'react'
import { useAppData } from '../../../infrastructure/appData/useAppData'
import { SectionCard } from '../SectionCard'
import { FavoriteTile } from './FavoriteTile'
import { FAVORITES_KEY, parseFavorites } from './favoritesValue'

export type FavoritesSectionProps = { onOpenSettings?: () => void }

function FavoritesSectionContent({ onOpenSettings }: FavoritesSectionProps) {
  const { value, loaded } = useAppData('user', FAVORITES_KEY)
  // Before the first value, "no favorites" would be a guess.
  if (!loaded) return <SectionCard title="Favorites" icon={Star} className="favorites-card" />
  const { entityIds } = parseFavorites(value)
  return (
    <SectionCard title="Favorites" icon={Star} className="favorites-card">
      {entityIds.length === 0 ? (
        <div className="empty-state">
          <p>No favorites yet</p>
          <button type="button" className="button--primary" onClick={onOpenSettings}>
            Add favorites
          </button>
        </div>
      ) : (
        <ul className="favorites">
          {entityIds.map((id) => (
            <FavoriteTile key={id} entityId={id} />
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

// HomeScreen re-renders on every clock tick and attention change; this section reads
// neither, so it only re-renders for its own data.
export const FavoritesSection = memo(FavoritesSectionContent)
