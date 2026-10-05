// Which entities the home screen uses and the thresholds that decide when they matter.
// It is the owner's house, so it arrives at runtime as /home.json (see home.example.json)
// and is never baked into the bundle. Features and the app import from here; domains
// never do.

export type HaAction = {
  domain: string
  service: string
  entity_id: string
}

export const LEFT_ON_ICONS = ['garage', 'door', 'heater', 'light', 'fan', 'power'] as const
export type LeftOnIcon = (typeof LEFT_ON_ICONS)[number]

export type LeftOnRule = {
  id: string
  label: string
  entity_id: string
  // State that means "left on" (door: open).
  onState: 'on'
  minutes: number
  // Badge glyph on the attention row; defaults from the action's domain.
  icon?: LeftOnIcon
  // Wired up by a later task; the rule carries it so the card can show it disabled.
  action: HaAction
}

export type BatteryRule = {
  threshold: number
  ignore: string[]
}

export type UpdateRule = {
  id: string
  label?: string
  entity_id: string
  state: 'on'
}

export type TonerRule = {
  entity_id: string
  below: number
  reorderUrl: string
}

export type FilterRule = {
  id: string
  label: string
  entity_id: string
  belowDays: number
  resetScript: string
}

export type SuggestionsConfig = {
  player: string
  playing: { scene: string; label: string; transition?: number }
  paused: { scene: string; label: string }
}

export type CryptoCoin = { symbol: string; entity_id: string }

export type WeatherConfig = { entity_id: string; sun: string }

export type SystemsConfig = {
  // The chip reads "{label} online" / "{label} offline"; online when the state equals upState.
  status: { entity_id: string; upState: string; label: string }
  // Timestamp sensor holding the boot time; label sits under the value.
  uptime?: { entity_id: string; label: string }
  // Own upState on purpose: pointing `status` at a Ping sensor must not change these.
  accessPoints?: { entity_ids: string[]; upState: string }
  backup?: string
  cpu?: { label: string; entity_id: string }[]
}

export type MediaConfig = { players: string[] }

// HA domains a room can hold. Buttons and remotes never become tiles; export so the room
// model filters by the same list the parser enforces on `add`.
export const ROOM_DOMAINS = [
  'light',
  'switch',
  'fan',
  'input_boolean',
  'scene',
  'script',
  'media_player',
  'cover',
  'climate',
  'lock',
] as const

export type RoomsConfig = {
  hidden: string[]
  // The area Auto shows when the signed-in person is away.
  awayRoom?: string
  areas: Record<string, { add: string[]; remove: string[] }>
}

export type HomeConfig = {
  leftOnRules: LeftOnRule[]
  batteryRule: BatteryRule
  updateRules: UpdateRule[]
  tonerRule: TonerRule
  filterRules: FilterRule[]
  suggestions: SuggestionsConfig
  crypto: CryptoCoin[]
  // Overrides the person.* entities Home Assistant knows about, in this order.
  people?: string[]
  weather?: WeatherConfig
  systems?: SystemsConfig
  media?: MediaConfig
  rooms: RoomsConfig
  // Entities that always need a second tap, wherever they appear.
  confirm: string[]
}

type Obj = Record<string, unknown>

const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

const fail = (path: string, expected: string): never => {
  throw new Error(`${path} must be ${expected}`)
}

const object = (v: unknown, path: string): Obj => (isObject(v) ? v : fail(path, 'an object'))

const string = (o: Obj, key: string, path: string): string =>
  typeof o[key] === 'string' ? (o[key] as string) : fail(`${path}.${key}`, 'a string')

const number = (o: Obj, key: string, path: string): number =>
  typeof o[key] === 'number' ? (o[key] as number) : fail(`${path}.${key}`, 'a number')

const optional = <T>(
  o: Obj,
  key: string,
  path: string,
  read: (o: Obj, key: string, path: string) => T,
): T | undefined => (o[key] === undefined ? undefined : read(o, key, path))

const only = <T extends string>(o: Obj, key: string, path: string, value: T): T =>
  o[key] === value ? value : fail(`${path}.${key}`, `"${value}"`)

const oneOf =
  <T extends string>(allowed: readonly T[]) =>
  (o: Obj, key: string, path: string): T =>
    allowed.includes(o[key] as T)
      ? (o[key] as T)
      : fail(`${path}.${key}`, `one of ${allowed.join(', ')}`)

// The path of `key` inside `path`; the root's path is ''.
const at = (path: string, key: string) => (path ? `${path}.${key}` : key)

const section = (o: Obj, key: string, path: string): Obj => object(o[key], at(path, key))

// An optional object: absent is undefined, present must parse (a typo is an error, not a
// hidden card).
const optionalSection = <T>(
  o: Obj,
  key: string,
  path: string,
  read: (s: Obj, path: string) => T,
): T | undefined => (o[key] === undefined ? undefined : read(section(o, key, path), at(path, key)))

const list = <T>(o: Obj, key: string, path: string, read: (item: Obj, path: string) => T): T[] => {
  const raw = o[key]
  if (!Array.isArray(raw)) return fail(at(path, key), 'an array')
  return raw.map((item, i) => {
    const itemPath = `${at(path, key)}[${i}]`
    return read(object(item, itemPath), itemPath)
  })
}

const strings = (o: Obj, key: string, path: string): string[] => {
  const raw = o[key]
  if (!Array.isArray(raw)) return fail(at(path, key), 'an array')
  raw.forEach((v, i) => {
    if (typeof v !== 'string') fail(`${at(path, key)}[${i}]`, 'a string')
  })
  return raw as string[]
}

const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/

const entityIds = (o: Obj, key: string, path: string): string[] => {
  const ids = o[key] === undefined ? [] : strings(o, key, path)
  ids.forEach((id, i) => {
    if (!ENTITY_ID.test(id)) fail(`${at(path, key)}[${i}]`, 'an entity id like domain.object_id')
  })
  return ids
}

// Unlike the older sections, rooms rejects keys it doesn't know, so a typo is reported.
const knownKeys = (o: Obj, allowed: string[], path: string) => {
  for (const key of Object.keys(o)) {
    if (!allowed.includes(key)) fail(at(path, key), `one of ${allowed.join(', ')}`)
  }
}

const rooms = (r: Obj, p: string): RoomsConfig => {
  knownKeys(r, ['hidden', 'awayRoom', 'areas'], p)
  const hidden = r.hidden === undefined ? [] : strings(r, 'hidden', p)
  const areas: RoomsConfig['areas'] = {}
  const rawAreas = r.areas === undefined ? {} : section(r, 'areas', p)
  for (const [areaId, value] of Object.entries(rawAreas)) {
    const ap = `${p}.areas.${areaId}`
    if (!areaId) fail(`${p}.areas`, 'keyed by non-empty area ids')
    const a = object(value, ap)
    knownKeys(a, ['add', 'remove'], ap)
    const add = entityIds(a, 'add', ap)
    add.forEach((id, i) => {
      if (!(ROOM_DOMAINS as readonly string[]).includes(id.split('.')[0]))
        fail(`${ap}.add[${i}]`, `an entity in ${ROOM_DOMAINS.join(', ')}`)
    })
    areas[areaId] = { add, remove: entityIds(a, 'remove', ap) }
  }
  return { hidden, awayRoom: optional(r, 'awayRoom', p, string), areas }
}

const action = (o: Obj, path: string): HaAction => ({
  domain: string(o, 'domain', path),
  service: string(o, 'service', path),
  entity_id: string(o, 'entity_id', path),
})

const weather = (w: Obj, p: string): WeatherConfig => ({
  entity_id: string(w, 'entity_id', p),
  sun: optional(w, 'sun', p, string) ?? 'sun.sun',
})

const systems = (s: Obj, p: string): SystemsConfig => {
  const status = section(s, 'status', p)
  return {
    status: {
      entity_id: string(status, 'entity_id', `${p}.status`),
      upState: string(status, 'upState', `${p}.status`),
      label: string(status, 'label', `${p}.status`),
    },
    uptime: optionalSection(s, 'uptime', p, (u, up) => ({
      entity_id: string(u, 'entity_id', up),
      label: string(u, 'label', up),
    })),
    accessPoints: optionalSection(s, 'accessPoints', p, (a, ap) => ({
      entity_ids: strings(a, 'entity_ids', ap),
      upState: string(a, 'upState', ap),
    })),
    backup: optional(s, 'backup', p, string),
    cpu: optional(s, 'cpu', p, (o, key, path) =>
      list(o, key, path, (c, cp) => ({
        label: string(c, 'label', cp),
        entity_id: string(c, 'entity_id', cp),
      })),
    ),
  }
}

const media = (m: Obj, p: string): MediaConfig => ({ players: strings(m, 'players', p) })

// Checks the shape of a parsed home.json and throws an Error naming the first bad field
// path (e.g. "leftOnRules[1].minutes must be a number"), so the owner can fix the file.
export function parseHomeConfig(raw: unknown): HomeConfig {
  const root = isObject(raw) ? raw : fail('home.json', 'an object')
  const toner = section(root, 'tonerRule', '')
  const battery = section(root, 'batteryRule', '')
  const suggestions = section(root, 'suggestions', '')
  const playing = section(suggestions, 'playing', 'suggestions')
  const paused = section(suggestions, 'paused', 'suggestions')

  return {
    leftOnRules: list(root, 'leftOnRules', '', (r, p) => ({
      id: string(r, 'id', p),
      label: string(r, 'label', p),
      entity_id: string(r, 'entity_id', p),
      onState: only(r, 'onState', p, 'on'),
      minutes: number(r, 'minutes', p),
      icon: optional(r, 'icon', p, oneOf(LEFT_ON_ICONS)),
      action: action(section(r, 'action', p), `${p}.action`),
    })),
    batteryRule: {
      threshold: number(battery, 'threshold', 'batteryRule'),
      ignore: strings(battery, 'ignore', 'batteryRule'),
    },
    updateRules: list(root, 'updateRules', '', (r, p) => ({
      id: string(r, 'id', p),
      label: optional(r, 'label', p, string),
      entity_id: string(r, 'entity_id', p),
      state: only(r, 'state', p, 'on'),
    })),
    tonerRule: {
      entity_id: string(toner, 'entity_id', 'tonerRule'),
      below: number(toner, 'below', 'tonerRule'),
      reorderUrl: string(toner, 'reorderUrl', 'tonerRule'),
    },
    filterRules: list(root, 'filterRules', '', (r, p) => ({
      id: string(r, 'id', p),
      label: string(r, 'label', p),
      entity_id: string(r, 'entity_id', p),
      belowDays: number(r, 'belowDays', p),
      resetScript: string(r, 'resetScript', p),
    })),
    suggestions: {
      player: string(suggestions, 'player', 'suggestions'),
      playing: {
        scene: string(playing, 'scene', 'suggestions.playing'),
        label: string(playing, 'label', 'suggestions.playing'),
        transition: optional(playing, 'transition', 'suggestions.playing', number),
      },
      paused: {
        scene: string(paused, 'scene', 'suggestions.paused'),
        label: string(paused, 'label', 'suggestions.paused'),
      },
    },
    crypto: list(root, 'crypto', '', (r, p) => ({
      symbol: string(r, 'symbol', p),
      entity_id: string(r, 'entity_id', p),
    })),
    people: optional(root, 'people', '', strings),
    weather: optionalSection(root, 'weather', '', weather),
    systems: optionalSection(root, 'systems', '', systems),
    media: optionalSection(root, 'media', '', media),
    rooms: optionalSection(root, 'rooms', '', rooms) ?? { hidden: [], areas: {} },
    confirm: entityIds(root, 'confirm', ''),
  }
}
