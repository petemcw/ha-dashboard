import { describe, expect, it } from 'vitest'
import { parseFavorites, serializeFavorites } from './favoritesValue'

describe('favorites value', () => {
  it('reads the saved entity ids in order', () => {
    expect(parseFavorites({ version: 1, entityIds: ['light.b', 'switch.a'] })).toEqual({
      entityIds: ['light.b', 'switch.a'],
      writable: true,
    })
  })
  it('treats nothing saved as an empty list that is safe to write', () => {
    expect(parseFavorites(null)).toEqual({ entityIds: [], writable: true })
  })
  it.each([
    ['an unknown version', { version: 2, entityIds: ['light.a'] }],
    ['a non-object', 'junk'],
    ['a missing list', { version: 1 }],
    ['non-string ids', { version: 1, entityIds: [1, 'light.a'] }],
  ])('treats %s as empty and not safe to overwrite', (_n, value) => {
    expect(parseFavorites(value)).toEqual({ entityIds: [], writable: false })
  })
  it('serializes to the versioned shape', () => {
    expect(serializeFavorites(['light.a'])).toEqual({ version: 1, entityIds: ['light.a'] })
  })
})
