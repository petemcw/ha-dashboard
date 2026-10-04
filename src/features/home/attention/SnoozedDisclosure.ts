import {
  SnoozedCount,
  SnoozedDisclosureProvider,
  SnoozedList,
  SnoozedSummary,
  SnoozedToggle,
} from './SnoozedDisclosureParts'

// The snoozed list and its Show/Hide toggle, as parts each shell places where it wants,
// sharing one open state through the Provider. (The parts live in their own module so
// fast refresh keeps working there.)
export const SnoozedDisclosure = {
  Provider: SnoozedDisclosureProvider,
  Count: SnoozedCount,
  Summary: SnoozedSummary,
  Toggle: SnoozedToggle,
  List: SnoozedList,
}
