import {
  mdiBlinds,
  mdiCast,
  mdiFan,
  mdiLightbulb,
  mdiLock,
  mdiPalette,
  mdiScriptText,
  mdiShapeOutline,
  mdiThermostat,
  mdiToggleSwitch,
  mdiEye,
  mdiGauge,
} from '@mdi/js'

const DOMAIN_ICONS: Record<string, string> = {
  light: mdiLightbulb,
  switch: mdiToggleSwitch,
  fan: mdiFan,
  input_boolean: mdiToggleSwitch,
  scene: mdiPalette,
  script: mdiScriptText,
  media_player: mdiCast,
  cover: mdiBlinds,
  climate: mdiThermostat,
  lock: mdiLock,
  sensor: mdiGauge,
  binary_sensor: mdiEye,
}

// The default icon for an entity when HA gives it none, chosen by its HA domain.
export function domainIcon(entityId: string): string {
  const domain = entityId.split('.')[0]
  return Object.hasOwn(DOMAIN_ICONS, domain) ? DOMAIN_ICONS[domain] : mdiShapeOutline
}
