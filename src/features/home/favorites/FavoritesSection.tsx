import { useAppData } from '../../../infrastructure/appData/useAppData'
import { FavoriteTile } from './FavoriteTile'
import { FAVORITES_KEY, parseFavorites } from './favoritesValue'

export type FavoritesSectionProps = { onOpenSettings?: () => void }

export function FavoritesSection({ onOpenSettings }: FavoritesSectionProps) {
  const { value, loaded } = useAppData('user', FAVORITES_KEY)
  // Before the first value, "no favorites" would be a guess.
  if (!loaded) return <section aria-label="Favorites" />
  const { entityIds } = parseFavorites(value)
  return (
    <section aria-label="Favorites">
      {entityIds.length === 0 ? (
        <>
          <p>No favorites yet</p>
          <button type="button" onClick={onOpenSettings}>
            Add favorites
          </button>
        </>
      ) : (
        <ul className="favorites">
          {entityIds.map((id) => (
            <FavoriteTile key={id} entityId={id} />
          ))}
        </ul>
      )}
    </section>
  )
}
