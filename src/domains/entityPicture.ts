// entity_picture is a relative path and HA is a different origin from the app.
export function resolveEntityPicture(path: unknown, haUrl: string): string | undefined {
  if (typeof path !== 'string' || path === '') return undefined
  return new URL(path, haUrl).toString()
}
