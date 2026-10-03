// Which entities the home screen uses and the thresholds that decide when they matter.
// It is the owner's house, so it arrives at runtime as /home.json (see home.example.json)
// and is never baked into the bundle. Features and the app import from here; domains
// never do.

export type HaAction = {
  domain: string
  service: string
  entity_id: string
}

export type LeftOnRule = {
  id: string
  label: string
  entity_id: string
  // State that means "left on" (door: open).
  onState: 'on'
  minutes: number
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

const section = (o: Obj, key: string, path: string): Obj =>
  object(o[key], path ? `${path}.${key}` : key)

const list = <T>(o: Obj, key: string, path: string, read: (item: Obj, path: string) => T): T[] => {
  const at = path ? `${path}.${key}` : key
  const raw = o[key]
  if (!Array.isArray(raw)) return fail(at, 'an array')
  return raw.map((item, i) => read(object(item, `${at}[${i}]`), `${at}[${i}]`))
}

const strings = (o: Obj, key: string, path: string): string[] => {
  const raw = o[key]
  if (!Array.isArray(raw)) return fail(path ? `${path}.${key}` : key, 'an array')
  raw.forEach((v, i) => {
    if (typeof v !== 'string') fail(`${key}[${i}]`, 'a string')
  })
  return raw as string[]
}

const action = (o: Obj, path: string): HaAction => ({
  domain: string(o, 'domain', path),
  service: string(o, 'service', path),
  entity_id: string(o, 'entity_id', path),
})

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
  }
}
