import type { ReactNode } from 'react'
import { entityStatus } from '../../../domains/entityStatus'
import { runEntityAction } from '../../../domains/generic/actions'
import { runScript } from '../../../domains/script/actions'
import { readEntityNow } from '../../../infrastructure/entities/readEntityNow'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import type { ServiceGateway } from '../../../infrastructure/serviceGateway/serviceGateway'
import { useAction } from '../../../infrastructure/serviceGateway/useAction'
import { ActionButton } from '../../shared/ActionButton'
import { ActionError } from '../../shared/ActionError'
import { ConfirmButton } from '../../shared/ConfirmButton'
import { ActionGlyph } from './attentionIcons'
import type { RunnableAction } from './types'

// The item stays until HA reports the sensor change, so there is nothing to hide here:
// pending ends on HA's ack, and the list updates from the entity store.
// Returns the button and the failure line separately: the row puts the failure on its own
// line, so a long message never widens the actions column.
export function useAttentionAction(action: RunnableAction): {
  control: ReactNode
  failure: ReactNode
} {
  const sensor = useEntity(action.sensorId)
  // HA drops a missing or unavailable target, logs a warning, and still answers with success
  // (entity_service_call in helpers/service.py), so an offline opener would look like it
  // worked. Disable instead of sending into the void.
  const target = useEntity(action.script ?? action.ha.entity_id)
  const { enabled, pending, failure, run } = useAction({ clearKey: sensor?.state })

  const send = async (gateway: ServiceGateway) => {
    if (action.script !== undefined) return runScript(gateway, action.script)
    // Read at send time: the door may have closed since the button was armed.
    if (readEntityNow(action.sensorId)?.state !== action.onState) return
    await runEntityAction(gateway, action.ha)
  }
  const press = () => run(send)
  const disabled = !enabled || entityStatus(target) !== 'ok'
  const icon = <ActionGlyph name={action.icon} />

  const control = action.confirmLabel ? (
    <ConfirmButton
      label={action.label}
      confirmLabel={action.confirmLabel}
      pendingLabel={action.pendingLabel}
      icon={icon}
      onConfirm={press}
      disabled={disabled}
      pending={pending}
    />
  ) : (
    <ActionButton
      aria-label={pending ? action.pendingLabel : action.label}
      disabled={disabled}
      pending={pending}
      onPress={press}
    >
      {icon}
    </ActionButton>
  )
  return { control, failure: <ActionError failure={failure} /> }
}
