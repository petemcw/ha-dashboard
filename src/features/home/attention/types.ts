export type AttentionItem = {
  id: string
  tier: 'urgent' | 'chore'
  title: string
  detail: string
  action?: { label: string; enabled: false } | { label: string; href: string }
}
