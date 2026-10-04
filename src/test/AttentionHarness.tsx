import { AttentionSection } from '../features/home/attention/AttentionSection'
import { useAttention } from '../features/home/attention/useAttention'
import type { getConnection } from '../infrastructure/ha/connection'

// Wires the attention hook into the section the way HomeScreen does, for tests that
// exercise the two together.
export function AttentionHarness({ connect }: { connect?: typeof getConnection }) {
  return <AttentionSection attention={useAttention(connect)} />
}
