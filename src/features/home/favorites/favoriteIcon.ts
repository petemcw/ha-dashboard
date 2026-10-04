import {
  Blinds,
  CircleDot,
  Fan,
  Lightbulb,
  Lock,
  Play,
  Plug,
  Sparkles,
  Speaker,
  Thermometer,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  light: Lightbulb,
  switch: Plug,
  fan: Fan,
  scene: Sparkles,
  script: Play,
  media_player: Speaker,
  cover: Blinds,
  climate: Thermometer,
  lock: Lock,
}

// Decorative: picked from the HA domain alone, with a neutral dot for anything unmapped.
export function favoriteIcon(entityId: string): LucideIcon {
  return ICONS[entityId.split('.')[0]] ?? CircleDot
}
