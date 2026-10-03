import { friendlyName } from '../../../domains/entityStatus'
import { lightViewModel } from '../../../domains/light/viewModel'
import { stateViewModel } from '../../../domains/generic/viewModel'
import { switchViewModel } from '../../../domains/switch/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { LightTile } from './LightTile'
import { StateTile } from './StateTile'
import { SwitchTile } from './SwitchTile'

export function FavoriteTile({ entityId }: { entityId: string }) {
  const entity = useEntity(entityId)
  // A missing entity keeps its id as the name: it was saved once, so show it, don't drop it.
  const name = friendlyName(entityId, entity)
  switch (entityId.split('.')[0]) {
    case 'light':
      return <LightTile name={name} light={lightViewModel(entityId, entity)} />
    case 'switch':
      return <SwitchTile name={name} switch={switchViewModel(entityId, entity)} />
    default:
      return <StateTile name={name} entity={stateViewModel(entityId, entity)} />
  }
}
