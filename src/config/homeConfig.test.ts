import { describe, expect, it } from 'vitest'
import exampleJson from '../../home.example.json?raw'
import { parseHomeConfig } from './homeConfig'

// A fresh copy per call, so a test can break one field without touching the next.
// oxlint-disable-next-line typescript/no-explicit-any
const example = (): Record<string, any> => JSON.parse(exampleJson)

describe('parsing home.json', () => {
  it('accepts home.example.json so the example cannot rot', () => {
    const parsed = parseHomeConfig(example())
    expect(parsed.leftOnRules.length).toBeGreaterThan(0)
    expect(parsed.people).toBeUndefined()
  })

  it('keeps the optional people list when present', () => {
    const parsed = parseHomeConfig({ ...example(), people: ['person.a', 'person.b'] })
    expect(parsed.people).toEqual(['person.a', 'person.b'])
  })

  it('names the invalid field when home.json has the wrong shape', () => {
    const raw = example()
    raw.leftOnRules[1].minutes = '30'
    expect(() => parseHomeConfig(raw)).toThrow('leftOnRules[1].minutes must be a number')
  })

  it('names a missing top-level section', () => {
    const raw = example()
    delete raw.tonerRule
    expect(() => parseHomeConfig(raw)).toThrow('tonerRule must be an object')
  })

  it('names a nested field that is not a string', () => {
    const raw = example()
    raw.suggestions.playing.scene = 3
    expect(() => parseHomeConfig(raw)).toThrow('suggestions.playing.scene must be a string')
  })

  it('rejects a list that is not an array', () => {
    const raw = example()
    raw.crypto = {}
    expect(() => parseHomeConfig(raw)).toThrow('crypto must be an array')
  })

  it('rejects people that are not all strings', () => {
    expect(() => parseHomeConfig({ ...example(), people: ['person.a', 4] })).toThrow(
      'people[1] must be a string',
    )
  })

  it('rejects a document that is not an object', () => {
    expect(() => parseHomeConfig(null)).toThrow('home.json must be an object')
  })

  it('rejects an unsupported onState', () => {
    const raw = example()
    raw.leftOnRules[0].onState = 'off'
    expect(() => parseHomeConfig(raw)).toThrow('leftOnRules[0].onState must be "on"')
  })

  it('allows the optional label and transition to be absent but not mistyped', () => {
    const raw = example()
    delete raw.updateRules[0].label
    delete raw.suggestions.playing.transition
    expect(() => parseHomeConfig(raw)).not.toThrow()
    raw.updateRules[0].label = 5
    expect(() => parseHomeConfig(raw)).toThrow('updateRules[0].label must be a string')
  })
})

describe('the shared test house', () => {
  it('is a valid home config', async () => {
    const { testHomeConfig } = await import('./testHomeConfig')
    expect(parseHomeConfig(JSON.parse(JSON.stringify(testHomeConfig)))).toEqual(testHomeConfig)
  })
})
