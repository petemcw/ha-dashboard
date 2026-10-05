import './EntityTile.css'
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
import { entityIcon } from './entityIcon'
import { LightTile } from './LightTile'
import { OnOffTile } from './OnOffTile'
import { SceneTile } from './SceneTile'
import { ScriptTile } from './ScriptTile'
import { StateTile } from './StateTile'
import { useConfirmListed } from './useConfirmListed'

// One entity as a tile, chosen by its HA domain: a toggle, a run button, or a display-only
// tile. Favorites use it as is; the room card puts its own light tile in front of it.
export function EntityTile({ entityId }: { entityId: string }) {
  const entity = useEntity(entityId)
  const confirmListed = useConfirmListed(entityId)
  // An error clears when HA reports a new state for the entity.
  const { enabled, pending, failure, run } = useAction({ clearKey: entity?.state })
  // A missing entity keeps its id as the name: it was saved once, so show it, don't drop it.
  const name = friendlyName(entityId, entity)
  const icon = entityIcon(entityId, entity)
  const control = (
    status: EntityStatus,
    action: (gateway: ServiceGateway) => Promise<unknown>,
    verb: string,
  ) => ({
    onPress: () => run(action),
    pending,
    failure,
    disabled: !enabled || status !== 'ok',
    confirm: confirmListed ? { action: `${verb} ${name}` } : undefined,
  })
  // Sends the opposite of what the tile shows now, never a toggle.
  const toggle = (vm: OnOffViewModel) =>
    control(
      vm.status,
      (gateway) => setOnOff(gateway, entityId, !vm.isOn),
      vm.isOn ? 'turn off' : 'turn on',
    )

  switch (entityId.split('.')[0]) {
    case 'light': {
      const light = lightViewModel(entityId, entity)
      return <LightTile name={name} icon={icon} light={light} {...toggle(light)} />
    }
    case 'switch':
    case 'fan':
    case 'input_boolean': {
      const onOff = onOffViewModel(entityId, entity)
      return <OnOffTile name={name} icon={icon} entity={onOff} {...toggle(onOff)} />
    }
    case 'script': {
      const script = scriptViewModel(entityId, entity)
      const runIt = (gateway: ServiceGateway) => runScript(gateway, entityId)
      return (
        <ScriptTile
          name={name}
          icon={icon}
          script={script}
          {...control(script.status, runIt, 'run')}
        />
      )
    }
    case 'scene': {
      const scene = sceneViewModel(entityId, entity)
      const activate = (gateway: ServiceGateway) => activateScene(gateway, entityId)
      return (
        <SceneTile
          name={name}
          icon={icon}
          scene={scene}
          {...control(scene.status, activate, 'activate')}
        />
      )
    }
    default:
      return <StateTile name={name} icon={icon} entity={stateViewModel(entityId, entity)} />
  }
}
