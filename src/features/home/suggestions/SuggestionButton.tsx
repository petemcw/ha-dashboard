import { activateScene } from '../../../domains/scene/actions'
import { sceneViewModel } from '../../../domains/scene/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { useAction } from '../../../infrastructure/serviceGateway/useAction'
import { ActionButton } from '../../shared/ActionButton'
import { ActionError } from '../../shared/ActionError'
import type { Suggestion } from './suggestionRules'

// Its own component because each suggestion needs its own action state (hooks can't
// run in the strip's map loop).
export function SuggestionButton({ suggestion }: { suggestion: Suggestion }) {
  // A scene's state is its last activation time, so a new state means HA ran it.
  const scene = useEntity(suggestion.id)
  // HA acks a call to a scene it doesn't have without doing anything, so a missing or
  // unavailable scene would look like it worked. Disable instead, as tiles do.
  const { status } = sceneViewModel(suggestion.id, scene)
  const { enabled, pending, failure, run } = useAction({ clearKey: scene?.state })
  return (
    <>
      <ActionButton
        className="suggestion"
        disabled={!enabled || status !== 'ok'}
        pending={pending}
        onPress={() =>
          run((gateway) =>
            activateScene(gateway, suggestion.id, { transition: suggestion.transition }),
          )
        }
      >
        {suggestion.label}
      </ActionButton>
      <ActionError failure={failure} />
    </>
  )
}
