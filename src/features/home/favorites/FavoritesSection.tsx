import { useAppData } from '../../../infrastructure/appData/useAppData'
import { SectionCard } from '../SectionCard'
import { FavoriteTile } from './FavoriteTile'
import { FAVORITES_KEY, parseFavorites } from './favoritesValue'

export type FavoritesSectionProps = { onOpenSettings?: () => void }

export function FavoritesSection({ onOpenSettings }: FavoritesSectionProps) {
  const { value, loaded } = useAppData('user', FAVORITES_KEY)
  // Before the first value, "no favorites" would be a guess.
  if (!loaded) return <SectionCard title="Favorites" className="favorites-card" />
  const { entityIds } = parseFavorites(value)
  return (
    <SectionCard title="Favorites" className="favorites-card">
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
