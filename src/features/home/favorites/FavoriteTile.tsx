import { friendlyName, type EntityStatus } from '../../../domains/entityStatus'
import { stateViewModel } from '../../../domains/generic/viewModel'
import { lightViewModel } from '../../../domains/light/viewModel'
import { onOffViewModel, type OnOffViewModel } from '../../../domains/onOff'
import { setOnOff } from '../../../domains/onOffActions'
import { activateScene } from '../../../domains/scene/actions'
import { sceneViewModel } from '../../../domains/scene/viewModel'
import { runScript } from '../../../domains/script/actions'
import { scriptViewModel } from '../../../domains/script/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import type { ServiceGateway } from '../../../infrastructure/serviceGateway/serviceGateway'
import { useAction } from '../../../infrastructure/serviceGateway/useAction'
import { LightTile } from './LightTile'
import { OnOffTile } from './OnOffTile'
import { SceneTile } from './SceneTile'
import { ScriptTile } from './ScriptTile'
import { StateTile } from './StateTile'

export function FavoriteTile({ entityId }: { entityId: string }) {
  const entity = useEntity(entityId)
  // An error clears when HA reports a new state for the entity.
  const { enabled, pending, failure, run } = useAction({ clearKey: entity?.state })
  // A missing entity keeps its id as the name: it was saved once, so show it, don't drop it.
  const name = friendlyName(entityId, entity)
  const control = (
    status: EntityStatus,
    action: (gateway: ServiceGateway) => Promise<unknown>,
  ) => ({
    onPress: () => run(action),
    pending,
    failure,
    disabled: !enabled || status !== 'ok',
  })
  // Sends the opposite of what the tile shows now, never a toggle.
  const toggle = (vm: OnOffViewModel) =>
    control(vm.status, (gateway) => setOnOff(gateway, entityId, !vm.isOn))

  switch (entityId.split('.')[0]) {
    case 'light': {
      const light = lightViewModel(entityId, entity)
      return <LightTile name={name} light={light} {...toggle(light)} />
    }
    case 'switch':
    case 'fan': {
      const onOff = onOffViewModel(entityId, entity)
      return <OnOffTile name={name} entity={onOff} {...toggle(onOff)} />
    }
    case 'script': {
      const script = scriptViewModel(entityId, entity)
      const runIt = (gateway: ServiceGateway) => runScript(gateway, entityId)
      return <ScriptTile name={name} script={script} {...control(script.status, runIt)} />
    }
    case 'scene': {
      const scene = sceneViewModel(entityId, entity)
      const activate = (gateway: ServiceGateway) => activateScene(gateway, entityId)
      return <SceneTile name={name} scene={scene} {...control(scene.status, activate)} />
    }
    default:
      return <StateTile name={name} entity={stateViewModel(entityId, entity)} />
  }
}
