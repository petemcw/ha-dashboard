export type Presence = 'home' | 'away' | 'zone' | 'unknown' | 'unavailable' | 'missing'

export type PersonViewModel = {
  entity_id: string
  name: string
  // First word of the name, for the visible label; `name` stays the accessible name.
  shortName: string
  initials: string
  presence: Presence
  zoneName?: string
  pictureUrl?: string
  // The HA user this person belongs to (the `user_id` attribute).
  userId?: string
}
