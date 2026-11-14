import { escapeRegExp, omit } from '../src'

describe('omit', () => {
  it.each([1, '1'])('omits a numeric property using key %s', (key) => {
    expect(omit({ 1: 'remove', 2: 'keep' }, key)).toEqual({ 2: 'keep' })
  })

  it('removes only the requested top-level keys without changing the source', () => {
    const nested = { keep: true }
    const source = { keep: nested, remove: 2, missing: undefined }
    const result = omit(source, 'remove', 'unknown')

    expect(result).toEqual({ keep: nested, missing: undefined })
    expect(result.keep).toBe(nested)
    expect(Object.hasOwn(result, 'missing')).toBe(true)
    expect(source.remove).toBe(2)
  })

  it('preserves enumerable inherited options and symbol keys', () => {
    const symbol = Symbol('option')
    const inheritedSymbol = Symbol('inherited option')
    const source = Object.assign(Object.create({ inherited: true, [inheritedSymbol]: 'value' }) as object, {
      own: true,
      remove: true,
      [symbol]: 'value'
    })
    Object.defineProperty(source, 'hidden', { value: true })

    expect(omit(source, 'remove')).toEqual({ own: true, inherited: true, [symbol]: 'value', [inheritedSymbol]: 'value' })
    expect(Object.hasOwn(omit(source, symbol), symbol)).toBe(false)
  })

  it('respects own properties that shadow inherited properties', () => {
    const source = Object.assign(Object.create({ visible: 'inherited', hidden: 'inherited' }) as object, {
      visible: 'own'
    })
    Object.defineProperty(source, 'hidden', { value: 'own', enumerable: false })

    expect(omit(source)).toEqual({ visible: 'own' })
  })

  it('treats dotted keys literally and safely copies prototype-named keys', () => {
    const source = JSON.parse('{"__proto__":{"polluted":true},"nested":{"key":1},"nested.key":2}') as Record<string, unknown>
    const result = omit(source, 'nested.key')

    expect(result.nested).toEqual({ key: 1 })
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result).not.toHaveProperty('polluted')
    expect(Object.hasOwn(result, 'nested.key')).toBe(false)
  })

  it.each([null, undefined])('accepts absent options: %s', (value) => {
    expect(omit(value, 'missing')).toEqual({})
  })
})

describe('escapeRegExp', () => {
  it.each([
    ['', ''],
    ['plain text', 'plain text'],
    ['.*+?^${}()|[]\\', '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'],
    ['a/b-c', 'a/b-c'],
    ['100%_match', '100%_match'],
    ['héllo 🌍', 'héllo 🌍']
  ])('escapes %s literally', (value, expected) => {
    expect(escapeRegExp(value)).toBe(expected)
  })

  it('keeps SQL LIKE wildcards available for subsequent conversion', () => {
    const escaped = escapeRegExp('%[a.b]%')

    expect(escaped).toBe('%\\[a\\.b\\]%')
    expect(new RegExp(escaped.replace(/%/g, '.*')).test('prefix[a.b]suffix')).toBe(true)
    expect(new RegExp(escaped.replace(/%/g, '.*')).test('prefixaxbSuffix')).toBe(false)
  })
})
