export type Presence = 'home' | 'away' | 'zone' | 'unknown' | 'unavailable' | 'missing'

export type PersonViewModel = {
  entity_id: string
  name: string
  initials: string
  presence: Presence
  zoneName?: string
  pictureUrl?: string
}
