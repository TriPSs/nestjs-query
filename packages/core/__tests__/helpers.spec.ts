import { BadRequestException } from '@nestjs/common'
import {
  AggregateResponse,
  applyFilter,
  applyPaging,
  applyQuery,
  applySort,
  ensureMatchesCreationFilter,
  Filter,
  filterCreatableRecords,
  getFilterComparisons,
  getFilterFields,
  getFilterOmitting,
  InvalidFilterError,
  mergeFilter,
  mergeFilters,
  Paging,
  Query,
  QueryFieldMap,
  SortDirection,
  SortField,
  SortNulls,
  transformAggregateQuery,
  transformAggregateResponse,
  transformFilter,
  transformFilterComparisons,
  transformQuery,
  transformSort
} from '@ptc-org/nestjs-query-core'
import { runInNewContext } from 'vm'

import { AggregateQuery } from '../src/interfaces/aggregate-query.interface'

class TestDTO {
  first?: string | null

  last?: string | null

  age?: number | null

  isVerified?: boolean | null

  created?: Date | null
}

class TestEntity {
  firstName!: string

  lastName!: string

  ageInYears?: number
}

const fieldMap: QueryFieldMap<TestDTO, TestEntity> = {
  first: 'firstName',
  last: 'lastName',
  age: 'ageInYears'
}

describe('transformSort', () => {
  it('should return undefined if sorting is undefined', () => {
    expect(transformSort(undefined, fieldMap)).toBeUndefined()
  })

  it('should transform the fields to the correct names', () => {
    const dtoSort: SortField<TestDTO>[] = [
      { field: 'first', direction: SortDirection.DESC },
      { field: 'last', direction: SortDirection.ASC }
    ]
    const entitySort: SortField<TestEntity>[] = [
      { field: 'firstName', direction: SortDirection.DESC },
      { field: 'lastName', direction: SortDirection.ASC }
    ]
    expect(transformSort(dtoSort, fieldMap)).toEqual(entitySort)
  })

  it('should throw an error if the field name is not found', () => {
    const dtoSort: SortField<TestDTO>[] = [
      { field: 'first', direction: SortDirection.DESC },
      // @ts-ignore
      { field: 'lasts', direction: SortDirection.ASC }
    ]
    expect(() => transformSort(dtoSort, fieldMap)).toThrow("No corresponding field found for 'lasts' when transforming SortField")
  })
})

describe('transformFilter', () => {
  it('should return undefined if filter is undefined', () => {
    expect(transformFilter(undefined, fieldMap)).toBeUndefined()
  })

  it('should transform the fields to the correct names', () => {
    const dtoFilter: Filter<TestDTO> = {
      first: { eq: 'foo' },
      last: { neq: 'bar' }
    }
    const entityFilter: Filter<TestEntity> = {
      firstName: { eq: 'foo' },
      lastName: { neq: 'bar' }
    }
    expect(transformFilter(dtoFilter, fieldMap)).toEqual(entityFilter)
  })

  it('should transform AND groupings to the correct names', () => {
    const dtoFilter: Filter<TestDTO> = {
      and: [{ first: { eq: 'foo' } }, { last: { neq: 'bar' } }]
    }
    const entityFilter: Filter<TestEntity> = {
      and: [{ firstName: { eq: 'foo' } }, { lastName: { neq: 'bar' } }]
    }
    expect(transformFilter(dtoFilter, fieldMap)).toEqual(entityFilter)
  })

  it('should not transform AND groupings if the array is undefined', () => {
    const dtoFilter: Filter<TestDTO> = {
      and: undefined,
      first: { eq: 'foo' }
    }
    const entityFilter: Filter<TestEntity> = {
      and: undefined,
      firstName: { eq: 'foo' }
    }
    expect(transformFilter(dtoFilter, fieldMap)).toEqual(entityFilter)
  })

  it('should transform OR groupings to the correct names', () => {
    const dtoFilter: Filter<TestDTO> = {
      or: [{ first: { eq: 'foo' } }, { last: { neq: 'bar' } }]
    }
    const entityFilter: Filter<TestEntity> = {
      or: [{ firstName: { eq: 'foo' } }, { lastName: { neq: 'bar' } }]
    }
    expect(transformFilter(dtoFilter, fieldMap)).toEqual(entityFilter)
  })
  it('should transform nested groupings to the correct names', () => {
    const dtoFilter: Filter<TestDTO> = {
      or: [
        { and: [{ first: { eq: 'foo' } }, { last: { neq: 'bar' } }] },
        { or: [{ first: { eq: 'foo' } }, { last: { neq: 'bar' } }] }
      ]
    }
    const entityFilter: Filter<TestEntity> = {
      or: [
        { and: [{ firstName: { eq: 'foo' } }, { lastName: { neq: 'bar' } }] },
        { or: [{ firstName: { eq: 'foo' } }, { lastName: { neq: 'bar' } }] }
      ]
    }
    expect(transformFilter(dtoFilter, fieldMap)).toEqual(entityFilter)
  })

  it('should throw an error if the field name is not found', () => {
    const dtoFilter: Filter<TestDTO> = {
      first: { eq: 'foo' },
      // @ts-ignore
      lasts: { neq: 'bar' }
    }
    expect(() => transformFilter(dtoFilter, fieldMap)).toThrow(
      "No corresponding field found for 'lasts' when transforming Filter"
    )
  })
})

describe('transformQuery', () => {
  it('should transform a Query', () => {
    const dtoQuery: Query<TestDTO> = {
      filter: {
        first: { eq: 'foo' },
        last: { neq: 'bar' }
      },
      paging: { offset: 10, limit: 10 },
      sorting: [
        { field: 'first', direction: SortDirection.DESC },
        { field: 'last', direction: SortDirection.ASC }
      ]
    }
    const entityQuery: Query<TestEntity> = {
      filter: {
        firstName: { eq: 'foo' },
        lastName: { neq: 'bar' }
      },
      paging: { offset: 10, limit: 10 },
      sorting: [
        { field: 'firstName', direction: SortDirection.DESC },
        { field: 'lastName', direction: SortDirection.ASC }
      ]
    }
    expect(transformQuery(dtoQuery, fieldMap)).toEqual(entityQuery)
  })
})

describe('applyFilter', () => {
  it('should handle eq comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { eq: 'foo' }
    }
    expect(applyFilter({ first: 'foo', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'bar', last: 'foo' }, filter)).toBe(false)
  })

  it('should handle neq comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { neq: 'foo' }
    }
    expect(applyFilter({ first: 'bar', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'foo', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle gt comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { gt: 'b' }
    }
    expect(applyFilter({ first: 'c', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'b', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'a', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle gte comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { gte: 'b' }
    }
    expect(applyFilter({ first: 'c', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'b', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'a', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle lt comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { lt: 'b' }
    }
    expect(applyFilter({ first: 'a', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'b', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'c', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle lte comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { lte: 'b' }
    }
    expect(applyFilter({ first: 'a', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'b', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'c', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle like comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { like: '%oo' }
    }
    expect(applyFilter({ first: 'Foo', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'FOO', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'Foo Bar', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'o bar', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle notLike comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { notLike: '%oo' }
    }
    expect(applyFilter({ first: 'Foo', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'FOO', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'Foo Bar', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'o bar', last: 'bar' }, filter)).toBe(true)
  })

  it('should return every record matching a like filter when filtering an array', () => {
    const filter: Filter<TestDTO> = {
      first: { like: 'foo%' }
    }
    const records: TestDTO[] = [{ first: 'foo1' }, { first: 'foo2' }, { first: 'foo3' }]
    expect(applyFilter(records, filter)).toEqual(records)
  })

  it('should exclude every record matching a notLike filter when filtering an array', () => {
    const filter: Filter<TestDTO> = {
      first: { notLike: 'foo%' }
    }
    const records: TestDTO[] = [{ first: 'foo1' }, { first: 'foo2' }, { first: 'foo3' }]
    expect(applyFilter(records, filter)).toEqual([])
  })

  it('should return every record matching an iLike filter when filtering an array', () => {
    const filter: Filter<TestDTO> = {
      first: { iLike: 'foo%' }
    }
    const records: TestDTO[] = [{ first: 'FOO1' }, { first: 'Foo2' }, { first: 'foo3' }]
    expect(applyFilter(records, filter)).toEqual(records)
  })

  it('should exclude every record matching a notILike filter when filtering an array', () => {
    const filter: Filter<TestDTO> = {
      first: { notILike: 'foo%' }
    }
    const records: TestDTO[] = [{ first: 'FOO1' }, { first: 'Foo2' }, { first: 'foo3' }]
    expect(applyFilter(records, filter)).toEqual([])
  })

  it('should handle iLike comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { iLike: '%oo' }
    }
    expect(applyFilter({ first: 'Foo', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'FOO', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'Foo Bar', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'o bar', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle notILike comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { notILike: '%oo' }
    }
    expect(applyFilter({ first: 'Foo', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'FOO', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'Foo Bar', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'o bar', last: 'bar' }, filter)).toBe(true)
  })

  it('should handle in comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { in: ['Foo', 'Bar', 'Baz'] }
    }
    expect(applyFilter({ first: 'Foo', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'Bar', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'Baz', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'Boo', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle notIn comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { notIn: ['Foo', 'Bar', 'Baz'] }
    }
    expect(applyFilter({ first: 'Foo', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'Bar', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'Baz', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'Boo', last: 'bar' }, filter)).toBe(true)
  })

  it('should handle between comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { between: { lower: 'b', upper: 'd' } }
    }
    expect(applyFilter({ first: 'a', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'b', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'c', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'd', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'e', last: 'bar' }, filter)).toBe(false)
  })

  it('should handle notBetween comparisons', () => {
    const filter: Filter<TestDTO> = {
      first: { notBetween: { lower: 'b', upper: 'd' } }
    }
    expect(applyFilter({ first: 'a', last: 'foo' }, filter)).toBe(true)
    expect(applyFilter({ first: 'b', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'c', last: 'foo' }, filter)).toBe(false)
    expect(applyFilter({ first: 'd', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'e', last: 'bar' }, filter)).toBe(true)
  })

  it('should throw an error for an unknown operator', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      first: { foo: 'bar' }
    }
    expect(() => applyFilter({ first: 'baz', last: 'kaz' }, filter)).toThrow('unknown comparison "foo"')
  })

  it('should name the unknown operator when it is mixed with a known one', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      first: { eq: 'baz', foo: 'bar' }
    }
    expect(() => applyFilter({ first: 'baz', last: 'kaz' }, filter)).toThrow(
      'unknown comparison "foo" for field "first". A filter value must either compare a field, where every key is an ' +
        'operator (e.g. { eq: 1 }), or nest a filter, where every key is a field (e.g. { relation: { eq: 1 } }).'
    )
  })

  it('should not treat and or or as an unknown operator beside a comparison named field', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      nested: { and: [{ first: { eq: 'baz' } }], is: { eq: 'yes' } }
    }
    // @ts-ignore
    expect(applyFilter({ nested: { first: 'baz', is: 'yes' } }, filter)).toBe(true)
  })

  it('should name every unknown operator that is mixed with a known one', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      first: { eq: 'baz', foo: 'bar', baz: 'boo' }
    }
    expect(() => applyFilter({ first: 'baz', last: 'kaz' }, filter)).toThrow('unknown comparison "foo", "baz" for field "first"')
  })

  it('should still treat an object of unknown keys as a nested filter', () => {
    type ParentDTO = { child: TestDTO }
    const filter: Filter<ParentDTO> = { child: { first: { eq: 'foo' } } }
    expect(applyFilter({ child: { first: 'foo', last: 'bar' } }, filter)).toBe(true)
    expect(applyFilter({ child: { first: 'baz', last: 'bar' } }, filter)).toBe(false)
  })

  it('should reject an unknown operator that wraps known operators rather than silently matching', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      first: { nin: { neq: 'baz' } }
    }
    expect(() => applyFilter({ first: 'foo', last: 'kaz' }, filter)).toThrow(
      'unknown comparison "nin" for field "first". "first" holds a string, so those keys cannot be nested filter ' +
        'fields. A filter value must either compare a field, where every key is an operator (e.g. { eq: 1 }), or nest ' +
        'a filter, where every key is a field (e.g. { relation: { eq: 1 } }).'
    )
  })

  it('should reject a filter that nests into a non-object field value', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      age: { unregistered: { eq: 1 } }
    }
    expect(() => applyFilter({ first: 'foo', age: 10 }, filter)).toThrow(
      'unknown comparison "unregistered" for field "age". "age" holds a number, so those keys cannot be nested filter fields.'
    )
  })

  it('should read a relation with a field named after an operator beside another field as a nested filter', () => {
    type OwnerDTO = { is: string; first: string }
    type ParentDTO = { owner: OwnerDTO }
    const filter: Filter<ParentDTO> = { owner: { is: { eq: 'yes' }, first: { eq: 'baz' } } }
    expect(applyFilter({ owner: { is: 'yes', first: 'baz' } }, filter)).toBe(true)
    expect(applyFilter({ owner: { is: 'no', first: 'baz' } }, filter)).toBe(false)
  })

  it('should reject a lone field named after an operator unless it is wrapped in and', () => {
    type OwnerDTO = { is: string }
    type ParentDTO = { owner: OwnerDTO }
    const bareFilter: Filter<ParentDTO> = { owner: { is: { eq: 'yes' } } }
    const groupedFilter: Filter<ParentDTO> = { owner: { and: [{ is: { eq: 'yes' } }] } }
    expect(() => applyFilter({ owner: { is: 'yes' } }, bareFilter)).toThrow(InvalidFilterError)
    expect(applyFilter({ owner: { is: 'yes' } }, groupedFilter)).toBe(true)
    expect(applyFilter({ owner: { is: 'no' } }, groupedFilter)).toBe(false)
  })

  it('should reject a filter that nests into a Date field value', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      created: { nin: { neq: new Date(0) } }
    }
    expect(() => applyFilter({ created: new Date(1) }, filter)).toThrow(InvalidFilterError)
    expect(() => applyFilter({ created: new Date(1) }, filter)).toThrow('"created" holds a Date')
  })

  it('should reject a filter that nests into an array field value', () => {
    type TaggedDTO = { tags: string[] }
    const filter: Filter<TaggedDTO> = {
      // @ts-ignore
      tags: { nin: { neq: 'admin' } }
    }
    expect(() => applyFilter({ tags: ['admin'] }, filter)).toThrow(InvalidFilterError)
    expect(() => applyFilter({ tags: ['admin'] }, filter)).toThrow('"tags" holds an array')
  })

  it('should reject a comparison operator whose value is itself a comparison', () => {
    const filter: Filter<TestDTO> = {
      // @ts-ignore
      first: { neq: { eq: 'admin' } }
    }
    expect(() => applyFilter({ first: 'user' }, filter)).toThrow(InvalidFilterError)
    expect(() => applyFilter({ first: 'user' }, filter)).toThrow(
      'operator "neq" of field "first" requires a value to compare against'
    )
  })

  it('should reject an in or notIn comparison whose value is not an array', () => {
    // @ts-ignore
    const inFilter: Filter<TestDTO> = { first: { in: 'admin' } }
    // @ts-ignore
    const notInFilter: Filter<TestDTO> = { first: { notIn: 'admin' } }
    expect(() => applyFilter({ first: 'dmin' }, inFilter)).toThrow(InvalidFilterError)
    expect(() => applyFilter({ first: null }, notInFilter)).toThrow('operator "notIn" of field "first" requires an array')
  })

  it('should raise an InvalidFilterError for every filter it cannot read', () => {
    // @ts-ignore
    expect(() => applyFilter({ first: 'baz' }, { first: { foo: 'bar' } })).toThrow(InvalidFilterError)
    // @ts-ignore
    expect(() => applyFilter({ first: 'baz' }, { first: 'baz' })).toThrow(InvalidFilterError)
  })

  it('should keep treating a null nested value as a nested filter', () => {
    type ParentDTO = { child: TestDTO | null }
    const filter: Filter<ParentDTO> = { child: { first: { is: null } } }
    expect(applyFilter({ child: null }, filter)).toBe(true)
  })

  it.each([
    ['an empty object', {}],
    ['an object that is not a comparison', { value: 'admin' }],
    ['an array', ['admin']]
  ])('should reject a comparison operator whose value is %s rather than silently matching', (_, value) => {
    for (const operator of ['eq', 'neq', 'is', 'isNot', 'gt', 'gte', 'lt', 'lte']) {
      // @ts-ignore
      const filter: Filter<TestDTO> = { first: { [operator]: value } }
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ first: null }, filter)).toThrow(`operator "${operator}" of field "first" requires `)
    }
  })

  it('should not repeat the value of a rejected comparison in its message', () => {
    // @ts-ignore
    const filter: Filter<TestDTO> = { first: { in: { tenantId: 'tenant-secret' } } }
    expect(() => applyFilter({ first: 'user' }, filter)).toThrow('operator "in" of field "first" requires an array')
    expect(() => applyFilter({ first: 'user' }, filter)).not.toThrow('tenant-secret')
  })

  it('should reject an in or notIn comparison whose array holds an object or an array', () => {
    // @ts-ignore
    const nestedArrayFilter: Filter<TestDTO> = { first: { notIn: [['admin']] } }
    // @ts-ignore
    const objectFilter: Filter<TestDTO> = { first: { notIn: [{ eq: 'admin' }] } }
    expect(() => applyFilter({ first: 'admin' }, nestedArrayFilter)).toThrow(InvalidFilterError)
    expect(() => applyFilter({ first: 'admin' }, objectFilter)).toThrow('operator "notIn" of field "first" requires an array')
  })

  it.each([null, undefined, 5, { lower: 1 }, { upper: 10 }])(
    'should reject a between or notBetween comparison given %p rather than two bounds',
    (bounds) => {
      for (const operator of ['between', 'notBetween']) {
        // @ts-ignore
        const filter: Filter<TestDTO> = { age: { [operator]: bounds } }
        expect(() => applyFilter({ age: 5 }, filter)).toThrow(InvalidFilterError)
        expect(() => applyFilter({ age: 5 }, filter)).toThrow(`operator "${operator}" of field "age" requires an object`)
      }
    }
  )

  it.each([null, undefined, 5, {}])('should reject a like comparison given %p rather than a string', (pattern) => {
    for (const operator of ['like', 'notLike', 'iLike', 'notILike']) {
      // @ts-ignore
      const filter: Filter<TestDTO> = { first: { [operator]: pattern } }
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(`operator "${operator}" of field "first" requires a string`)
    }
  })

  it.each([null, 5, true, [], new Date(0)])(
    'should reject a field whose filter value is %p rather than a comparison',
    (value) => {
      // @ts-ignore
      const filter: Filter<TestDTO> = { first: value }
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow('unknown comparison "first"')
    }
  )

  it('should keep comparing against Dates and class instances', () => {
    class Money {
      constructor(readonly cents: number) {}
    }
    const price = new Money(5)
    type PricedDTO = { created: Date; price: Money }
    const record = { created: new Date(5), price }
    expect(applyFilter(record, { created: { gt: new Date(0) } } as Filter<PricedDTO>)).toBe(true)
    expect(applyFilter(record, { created: { between: { lower: new Date(0), upper: new Date(10) } } } as Filter<PricedDTO>)).toBe(
      true
    )
    expect(applyFilter(record, { price: { eq: price } } as Filter<PricedDTO>)).toBe(true)
    expect(applyFilter(record, { price: { in: [price] } } as Filter<PricedDTO>)).toBe(true)
  })

  it('should reject an object literal from another realm as a comparison value', () => {
    const foreignObjectLiteral = runInNewContext('({ tenantId: "acme" })') as object
    for (const operator of ['eq', 'neq', 'isNot', 'gt']) {
      // @ts-ignore
      const filter: Filter<TestDTO> = { first: { [operator]: foreignObjectLiteral } }
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(InvalidFilterError)
    }
    // @ts-ignore
    expect(() => applyFilter({ first: 'user' }, { first: { notIn: [foreignObjectLiteral] } })).toThrow(InvalidFilterError)
  })

  it('should reject a function as a comparison value rather than comparing by reference', () => {
    const getOwner = () => 'user'
    for (const operator of ['eq', 'neq', 'gt', 'lte']) {
      // @ts-ignore
      const filter: Filter<TestDTO> = { first: { [operator]: getOwner } }
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(InvalidFilterError)
    }
    // @ts-ignore
    expect(() => applyFilter({ first: 'user' }, { first: { notIn: [getOwner] } })).toThrow(InvalidFilterError)
  })

  it.each([null, undefined])('should reject a range comparison against %p rather than coercing it', (bound) => {
    for (const operator of ['gt', 'gte', 'lt', 'lte']) {
      const filter: Filter<TestDTO> = { age: { [operator]: bound } }
      expect(() => applyFilter({ age: -1 }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ age: null }, filter)).toThrow(`operator "${operator}" of field "age" requires a value`)
    }
  })

  it.each([
    ['a null bound', { lower: null, upper: 10 }],
    ['an undefined bound', { lower: 0, upper: undefined }],
    ['an object bound', { lower: {}, upper: 10 }],
    ['an array bound', { lower: [0], upper: 10 }]
  ])('should reject a between or notBetween comparison with %s', (_, bounds) => {
    for (const operator of ['between', 'notBetween']) {
      // @ts-ignore
      const filter: Filter<TestDTO> = { age: { [operator]: bounds } }
      expect(() => applyFilter({ age: null }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ age: -1 }, filter)).toThrow(`operator "${operator}" of field "age" requires an object`)
    }
  })

  it.each([undefined, {}, ['admin']])('should reject an is or isNot comparison against %p', (value) => {
    for (const operator of ['is', 'isNot']) {
      // @ts-ignore
      const filter: Filter<TestDTO> = { first: { [operator]: value } }
      expect(() => applyFilter({ first: 'admin' }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ first: 'admin' }, filter)).toThrow(`operator "${operator}" of field "first" requires a value`)
    }
  })

  it('should compare is and isNot against a value other than true, false or null, as the Mongoose adapter does', () => {
    // @ts-ignore
    expect(applyFilter({ first: 'acme' }, { first: { is: 'acme' } })).toBe(true)
    // @ts-ignore
    expect(applyFilter({ first: 'other' }, { first: { is: 'acme' } })).toBe(false)
    // @ts-ignore
    expect(applyFilter({ first: 'acme' }, { first: { isNot: 'acme' } })).toBe(false)
  })

  it('should compare Dates by the instant they hold rather than by reference', () => {
    const record: TestDTO = { created: new Date(5) }
    expect(applyFilter(record, { created: { eq: new Date(5) } })).toBe(true)
    expect(applyFilter(record, { created: { neq: new Date(5) } })).toBe(false)
    expect(applyFilter(record, { created: { neq: new Date(6) } })).toBe(true)
    expect(applyFilter(record, { created: { in: [new Date(5)] } })).toBe(true)
    expect(applyFilter(record, { created: { notIn: [new Date(5)] } })).toBe(false)
    expect(applyFilter(record, { created: { notIn: [new Date(6)] } })).toBe(true)
  })

  it.each([
    ['a regular expression wildcard', 'a.c', 'abc'],
    ['a regular expression alternation', 'x|', 'anything'],
    ['a regular expression quantifier', 'a+', 'aaa']
  ])('should match %s in a like pattern literally, as SQL does', (_, pattern, value) => {
    const record: TestDTO = { first: value }
    expect(applyFilter(record, { first: { like: pattern } })).toBe(false)
    expect(applyFilter(record, { first: { iLike: pattern } })).toBe(false)
    expect(applyFilter(record, { first: { notLike: pattern } })).toBe(true)
    expect(applyFilter(record, { first: { notILike: pattern } })).toBe(true)
  })

  it('should not raise a SyntaxError that repeats a like pattern holding regular expression syntax', () => {
    const record: TestDTO = { first: '(tenant-secret' }
    expect(applyFilter(record, { first: { like: '(tenant-secret' } })).toBe(true)
    expect(applyFilter(record, { first: { notILike: '[tenant-secret%' } })).toBe(true)
  })

  it('should match an underscore in a like pattern as any single character, as SQL does', () => {
    const record: TestDTO = { first: 'abc' }
    expect(applyFilter(record, { first: { like: 'a_c' } })).toBe(true)
    expect(applyFilter(record, { first: { notLike: 'a_c' } })).toBe(false)
    expect(applyFilter(record, { first: { like: 'a_' } })).toBe(false)
  })

  it('should match a percent in a like pattern across line breaks, as SQL does', () => {
    const record: TestDTO = { first: 'public\nsecret' }
    expect(applyFilter(record, { first: { like: '%secret%' } })).toBe(true)
    expect(applyFilter(record, { first: { notLike: '%secret%' } })).toBe(false)
    expect(applyFilter(record, { first: { notILike: '%SECRET' } })).toBe(false)
  })

  it('should match an underscore in a like pattern against a character outside the Basic Multilingual Plane', () => {
    const record: TestDTO = { first: '😀x' }
    expect(applyFilter(record, { first: { like: '_x' } })).toBe(true)
    expect(applyFilter(record, { first: { notLike: '_x' } })).toBe(false)
    expect(applyFilter(record, { first: { like: '__x' } })).toBe(false)
  })

  it.each([
    ['ascii letters of either case', 'Sales%', 'sALES team', 'sale'],
    ['a letter whose case folding is ascii but whose lower case is not', 'sales', 'SALES', 'ſales'],
    ['the kelvin sign, whose lower case is ascii', 'k', 'K', 'x']
  ])('should match %s in an iLike pattern the way Postgres lower-cases both sides', (_, pattern, matching, notMatching) => {
    expect(applyFilter({ first: matching }, { first: { iLike: pattern } })).toBe(true)
    expect(applyFilter({ first: matching }, { first: { notILike: pattern } })).toBe(false)
    expect(applyFilter({ first: notMatching }, { first: { iLike: pattern } })).toBe(false)
    expect(applyFilter({ first: notMatching }, { first: { notILike: pattern } })).toBe(true)
  })

  it.each([
    ['a dotted capital I, which ICU lower-cases to two characters and libc to one', '%İ', 'xİ', 'i'],
    ['an underscore against a dotted capital I', '_', 'x', 'İ'],
    ['a word-final sigma, which ICU lower-cases to ς and libc to σ', 'ΑΣ', 'ΑΣ', 'ας'],
    ['a sigma before a wildcard', 'ΑΣ%', 'ΑΣ', 'ΑΣΑ']
  ])(
    'should match %s in an iLike pattern only where both the ICU and the libc lower cases match',
    (_, pattern, matching, matchingUnderOneLowerCaseOnly) => {
      expect(applyFilter({ first: matching }, { first: { iLike: pattern } })).toBe(true)
      expect(applyFilter({ first: matching }, { first: { notILike: pattern } })).toBe(false)
      expect(applyFilter({ first: matchingUnderOneLowerCaseOnly }, { first: { iLike: pattern } })).toBe(false)
      expect(applyFilter({ first: matchingUnderOneLowerCaseOnly }, { first: { notILike: pattern } })).toBe(false)
    }
  )

  it('should match an underscore in an iLike pattern against a character outside the Basic Multilingual Plane', () => {
    expect(applyFilter({ first: '😀X' }, { first: { iLike: '_x' } })).toBe(true)
    expect(applyFilter({ first: '😀X' }, { first: { notILike: '_x' } })).toBe(false)
  })

  it.each([
    ['an escaped underscore', 'user\\_admin', 'user_admin', 'userXadmin'],
    ['an escaped percent', '100\\%', '100%', '1000'],
    ['an escaped backslash', 'a\\\\b', 'a\\b', 'a\\\\b'],
    ['an escaped ordinary character', 'a\\bc', 'abc', 'a\\bc']
  ])('should read %s in a like pattern the way Postgres and MySQL do', (_, pattern, matching, notMatching) => {
    expect(applyFilter({ first: matching }, { first: { like: pattern } })).toBe(true)
    expect(applyFilter({ first: matching }, { first: { notLike: pattern } })).toBe(false)
    expect(applyFilter({ first: notMatching }, { first: { like: pattern } })).toBe(false)
    expect(applyFilter({ first: notMatching }, { first: { notLike: pattern } })).toBe(true)
  })

  it('should match a trailing backslash in a like pattern literally, as MySQL and MariaDB do', () => {
    expect(applyFilter({ first: 'a\\' }, { first: { like: 'a\\' } })).toBe(true)
    expect(applyFilter({ first: 'a\\' }, { first: { notLike: 'a\\' } })).toBe(false)
    expect(applyFilter({ first: 'a' }, { first: { like: 'a\\' } })).toBe(false)
    expect(applyFilter({ first: 'a' }, { first: { notLike: 'a\\' } })).toBe(true)
  })

  it('should reject undefined as a comparison value rather than matching an omitted field', () => {
    for (const operator of ['eq', 'neq']) {
      const filter: Filter<TestDTO> = { first: { [operator]: undefined } }
      expect(() => applyFilter({} as TestDTO, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ first: 'user' }, filter)).toThrow(`operator "${operator}" of field "first" requires a value`)
    }
    for (const operator of ['in', 'notIn']) {
      const filter: Filter<TestDTO> = { first: { [operator]: ['user', undefined] } }
      expect(() => applyFilter({} as TestDTO, filter)).toThrow(InvalidFilterError)
    }
  })

  it('should reject NaN as a comparison value rather than matching every value', () => {
    for (const operator of ['eq', 'neq', 'is', 'isNot', 'gt', 'lte']) {
      const filter: Filter<TestDTO> = { age: { [operator]: Number.NaN } }
      expect(() => applyFilter({ age: 5 }, filter)).toThrow(InvalidFilterError)
      expect(() => applyFilter({ age: 5 }, filter)).toThrow(`operator "${operator}" of field "age" requires a value`)
    }
    for (const operator of ['in', 'notIn']) {
      const filter: Filter<TestDTO> = { age: { [operator]: [1, Number.NaN] } }
      expect(() => applyFilter({ age: 5 }, filter)).toThrow(InvalidFilterError)
    }
    expect(() => applyFilter({ age: 5 }, { age: { notBetween: { lower: Number.NaN, upper: 9 } } })).toThrow(InvalidFilterError)
  })

  it('should still match null against a null or omitted field', () => {
    expect(applyFilter({ first: null }, { first: { eq: null } })).toBe(true)
    expect(applyFilter({ first: 'user' }, { first: { neq: null } })).toBe(true)
    expect(applyFilter({ first: null }, { first: { in: [null] } })).toBe(true)
    expect(applyFilter({} as TestDTO, { first: { is: null } })).toBe(true)
  })

  it('should reject an invalid Date as a comparison value', () => {
    const invalidDate = new Date(Number.NaN)
    for (const operator of ['eq', 'neq', 'gt', 'lte']) {
      const filter: Filter<TestDTO> = { created: { [operator]: invalidDate } }
      expect(() => applyFilter({ created: new Date(5) }, filter)).toThrow(InvalidFilterError)
    }
    expect(() => applyFilter({ created: new Date(5) }, { created: { notIn: [invalidDate] } })).toThrow(InvalidFilterError)
    expect(() =>
      applyFilter({ created: new Date(5) }, { created: { notBetween: { lower: invalidDate, upper: new Date(9) } } })
    ).toThrow(InvalidFilterError)
  })

  it('should handle and grouping', () => {
    const filter: Filter<TestDTO> = {
      and: [{ first: { eq: 'foo' } }, { last: { like: '%bar' } }]
    }
    expect(applyFilter({ first: 'foo', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'foo', last: 'foobar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'oo', last: 'bar' }, filter)).toBe(false)
    expect(applyFilter({ first: 'foo', last: 'baz' }, filter)).toBe(false)
  })

  it('should handle or grouping', () => {
    const filter: Filter<TestDTO> = {
      or: [{ first: { eq: 'foo' } }, { last: { like: '%bar' } }]
    }
    expect(applyFilter({ first: 'foo', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'foo', last: 'foobar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'oo', last: 'bar' }, filter)).toBe(true)
    expect(applyFilter({ first: 'foo', last: 'baz' }, filter)).toBe(true)
    expect(applyFilter({ first: 'fo', last: 'ba' }, filter)).toBe(false)
  })

  describe('nested objects', () => {
    type ParentDTO = TestDTO & { child: TestDTO }
    const withChild = (child: TestDTO): ParentDTO => ({
      first: 'bar',
      child
    })
    type GrandParentDTO = TestDTO & { child: ParentDTO }
    const withGrandChild = (child: TestDTO): GrandParentDTO => ({
      first: 'bar',
      child: { first: 'baz', child }
    })

    it('should handle like comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { like: '%foo' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { like: '%foo' } } } }
      expect(applyFilter(withChild({ first: 'afoo' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'afoo' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(false)
    })

    it('should handle notLike comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { notLike: '%foo' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { notLike: '%foo' } } } }
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'afoo' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'afoo' }), grandParentFilter)).toBe(false)
    })

    it('should handle iLike comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { iLike: '%foo' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { iLike: '%foo' } } } }
      expect(applyFilter(withChild({ first: 'AFOO' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'AFOO' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(false)
    })

    it('should handle notILike comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { notILike: '%foo' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { notILike: '%foo' } } } }
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'AFOO' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'AFOO' }), grandParentFilter)).toBe(false)
    })

    it('should handle in comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { in: ['foo'] } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { in: ['foo'] } } } }
      expect(applyFilter(withChild({ first: 'foo' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'foo' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(false)
    })

    it('should handle notIn comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { notIn: ['foo'] } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { notIn: ['foo'] } } } }
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'foo' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'foo' }), grandParentFilter)).toBe(false)
    })

    it('should handle between comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { between: { lower: 'a', upper: 'c' } } } }
      const grandParentFilter: Filter<GrandParentDTO> = {
        child: { child: { first: { between: { lower: 'a', upper: 'c' } } } }
      }
      expect(applyFilter(withChild({ first: 'b' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'd' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'b' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'd' }), grandParentFilter)).toBe(false)
    })

    it('should handle notBetween comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { notBetween: { lower: 'a', upper: 'c' } } } }
      const grandParentFilter: Filter<GrandParentDTO> = {
        child: { child: { first: { notBetween: { lower: 'a', upper: 'c' } } } }
      }
      expect(applyFilter(withChild({ first: 'd' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'b' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'd' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'b' }), grandParentFilter)).toBe(false)
    })

    it('should handle gt comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { gt: 'c' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { gt: 'c' } } } }
      expect(applyFilter(withChild({ first: 'd' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'b' }), parentFilter)).toBe(false)
      expect(applyFilter(withChild({ first: 'c' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'd' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'b' }), grandParentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'c' }), grandParentFilter)).toBe(false)
    })

    it('should handle gte comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { gte: 'c' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { gte: 'c' } } } }
      expect(applyFilter(withChild({ first: 'c' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'd' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'b' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'c' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'd' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'b' }), grandParentFilter)).toBe(false)
    })

    it('should handle lt comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { lt: 'c' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { lt: 'c' } } } }
      expect(applyFilter(withChild({ first: 'b' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'd' }), parentFilter)).toBe(false)
      expect(applyFilter(withChild({ first: 'c' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'b' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'd' }), grandParentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'c' }), grandParentFilter)).toBe(false)
    })

    it('should handle lte comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { lte: 'c' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { lte: 'c' } } } }
      expect(applyFilter(withChild({ first: 'c' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'b' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'd' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'c' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'b' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'd' }), grandParentFilter)).toBe(false)
    })

    it('should handle eq comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { eq: 'foo' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { eq: 'foo' } } } }
      expect(applyFilter(withChild({ first: 'foo' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'foo' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(false)
    })

    it('should handle neq comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { neq: 'foo' } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { neq: 'foo' } } } }
      expect(applyFilter(withChild({ first: 'bar' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: 'foo' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: 'bar' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: 'foo' }), grandParentFilter)).toBe(false)
    })

    it('should handle is comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { is: null } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { is: null } } } }
      expect(applyFilter(withChild({ first: null }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({}), parentFilter)).toBe(true) // undefined
      expect(applyFilter(withChild({ first: 'foo' }), parentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({ first: null }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({}), grandParentFilter)).toBe(true) // undefined
      expect(applyFilter(withGrandChild({ first: 'foo' }), grandParentFilter)).toBe(false)
    })

    it('should handle isNot comparisons', () => {
      const parentFilter: Filter<ParentDTO> = { child: { first: { isNot: null } } }
      const grandParentFilter: Filter<GrandParentDTO> = { child: { child: { first: { isNot: null } } } }
      expect(applyFilter(withChild({ first: 'foo' }), parentFilter)).toBe(true)
      expect(applyFilter(withChild({ first: null }), parentFilter)).toBe(false)
      expect(applyFilter(withChild({}), parentFilter)).toBe(false) // undefined
      expect(applyFilter(withGrandChild({ first: 'foo' }), grandParentFilter)).toBe(true)
      expect(applyFilter(withGrandChild({ first: null }), grandParentFilter)).toBe(false)
      expect(applyFilter(withGrandChild({}), grandParentFilter)).toBe(false) // undefined
    })
  })

  describe('nested nulls', () => {
    type ParentDTO = TestDTO & { child: TestDTO | null }
    type GrandParentDTO = TestDTO & { child: ParentDTO | null }
    const singleNestedNull = (): ParentDTO => ({ child: null })
    const doubleNestedNull = (): GrandParentDTO => ({ child: null })

    it('should handle like comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { like: '%foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { like: '%foo' } } } })).toBe(false)
    })

    it('should handle notLike comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { notLike: '%foo' } } })).toBe(true)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { notLike: '%foo' } } } })).toBe(true)
    })

    it('should handle iLike comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { iLike: '%foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { iLike: '%foo' } } } })).toBe(false)
    })

    it('should handle notILike comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { notILike: '%foo' } } })).toBe(true)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { notILike: '%foo' } } } })).toBe(true)
    })

    it('should handle in comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { in: ['foo'] } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { in: ['foo'] } } } })).toBe(false)
    })

    it('should handle notIn comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { notIn: ['foo'] } } })).toBe(true)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { notIn: ['foo'] } } } })).toBe(true)
    })

    it('should handle between comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { between: { lower: 'foo', upper: 'bar' } } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { between: { lower: 'foo', upper: 'bar' } } } } })).toBe(
        false
      )
    })

    it('should handle notBetween comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { notBetween: { lower: 'foo', upper: 'bar' } } } })).toBe(true)
      expect(
        applyFilter(doubleNestedNull(), {
          child: { child: { first: { notBetween: { lower: 'foo', upper: 'bar' } } } }
        })
      ).toBe(true)
    })

    it('should handle gt comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { gt: 'foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { gt: 'foo' } } } })).toBe(false)
    })

    it('should handle gte comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { gte: 'foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { gte: 'foo' } } } })).toBe(false)
    })

    it('should handle lt comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { lt: 'foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { lt: 'foo' } } } })).toBe(false)
    })

    it('should handle lte comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { lte: 'foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { lte: 'foo' } } } })).toBe(false)
    })

    it('should handle eq comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { eq: 'foo' } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { eq: 'foo' } } } })).toBe(false)
    })

    it('should handle neq comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { neq: 'foo' } } })).toBe(true)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { neq: 'foo' } } } })).toBe(true)
    })

    it('should handle is comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { is: null } } })).toBe(true)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { is: null } } } })).toBe(true)
    })

    it('should handle isNot comparisons', () => {
      expect(applyFilter(singleNestedNull(), { child: { first: { isNot: null } } })).toBe(false)
      expect(applyFilter(doubleNestedNull(), { child: { child: { first: { isNot: null } } } })).toBe(false)
    })
  })
})

describe('getFilterFields', () => {
  class Test {
    strField!: string

    boolField!: string

    testRelation!: Test
  }

  it('should get all fields at root of filter', () => {
    const filter: Filter<Test> = {
      boolField: { is: true },
      strField: { eq: '' },
      testRelation: {
        boolField: { is: false }
      }
    }
    expect(getFilterFields(filter).sort()).toEqual(['boolField', 'strField', 'testRelation'])
  })

  it('should get all fields in and', () => {
    const filter: Filter<Test> = {
      and: [
        { boolField: { is: true } },
        { strField: { eq: '' } },
        {
          testRelation: {
            boolField: { is: false }
          }
        }
      ]
    }
    expect(getFilterFields(filter).sort()).toEqual(['boolField', 'strField', 'testRelation'])
  })

  it('should get all fields in or', () => {
    const filter: Filter<Test> = {
      or: [
        { boolField: { is: true } },
        { strField: { eq: '' } },
        {
          testRelation: {
            boolField: { is: false }
          }
        }
      ]
    }
    expect(getFilterFields(filter).sort()).toEqual(['boolField', 'strField', 'testRelation'])
  })

  it('should merge all identifiers  between root, and, or', () => {
    const filter: Filter<Test> = {
      or: [{ and: [{ boolField: { is: true } }, { strField: { eq: '' } }] }],
      testRelation: {
        boolField: { is: false }
      }
    }
    expect(getFilterFields(filter).sort()).toEqual(['boolField', 'strField', 'testRelation'])
  })
})

describe('transformAggregateQuery', () => {
  it('should transform an aggregate query', () => {
    const aggQuery: AggregateQuery<TestDTO> = {
      count: [{ field: 'first', args: {} }],
      sum: [{ field: 'age', args: {} }],
      max: [
        { field: 'first', args: {} },
        { field: 'last', args: {} },
        { field: 'age', args: {} }
      ],
      min: [
        { field: 'first', args: {} },
        { field: 'last', args: {} },
        { field: 'age', args: {} }
      ]
    }
    const entityAggQuery: AggregateQuery<TestEntity> = {
      count: [{ field: 'firstName', args: {} }],
      sum: [{ field: 'ageInYears', args: {} }],
      max: [
        { field: 'firstName', args: {} },
        { field: 'lastName', args: {} },
        { field: 'ageInYears', args: {} }
      ],
      min: [
        { field: 'firstName', args: {} },
        { field: 'lastName', args: {} },
        { field: 'ageInYears', args: {} }
      ]
    }
    expect(transformAggregateQuery(aggQuery, fieldMap)).toEqual(entityAggQuery)
  })

  it('should throw an error if an unknown field is encountered', () => {
    const aggQuery: AggregateQuery<TestDTO> = {
      count: [{ field: 'first', args: {} }],
      sum: [{ field: 'age', args: {} }],
      max: [
        { field: 'first', args: {} },
        { field: 'last', args: {} },
        { field: 'age', args: {} }
      ],
      min: [
        { field: 'first', args: {} },
        { field: 'last', args: {} },
        { field: 'age', args: {} }
      ]
    }
    // @ts-ignore
    expect(() => transformAggregateQuery(aggQuery, { last: 'lastName' })).toThrow(
      "No corresponding field found for 'first' when transforming aggregateQuery"
    )
  })
})

describe('transformAggregateResponse', () => {
  it('should transform an aggregate query', () => {
    const aggResponse: AggregateResponse<TestDTO> = {
      count: {
        first: 2
      },
      sum: {
        age: 101
      },
      max: {
        first: 'firstz',
        last: 'lastz',
        age: 100
      },
      min: {
        first: 'firsta',
        last: 'lasta',
        age: 1
      }
    }
    const entityAggResponse: AggregateResponse<TestEntity> = {
      count: {
        firstName: 2
      },
      sum: {
        ageInYears: 101
      },
      max: {
        firstName: 'firstz',
        lastName: 'lastz',
        ageInYears: 100
      },
      min: {
        firstName: 'firsta',
        lastName: 'lasta',
        ageInYears: 1
      }
    }
    expect(transformAggregateResponse(aggResponse, fieldMap)).toEqual(entityAggResponse)
  })

  it('should handle empty aggregate fields', () => {
    const aggResponse: AggregateResponse<TestDTO> = {
      count: {
        first: 2
      }
    }
    const entityAggResponse: AggregateResponse<TestEntity> = {
      count: {
        firstName: 2
      }
    }
    expect(transformAggregateResponse(aggResponse, fieldMap)).toEqual(entityAggResponse)
  })

  it('should throw an error if the field is not found', () => {
    let aggResponse: AggregateResponse<TestDTO> = {
      count: {
        first: 2
      }
    }
    // @ts-ignore
    expect(() => transformAggregateResponse(aggResponse, { last: 'lastName' })).toThrow(
      "No corresponding field found for 'first' when transforming aggregateQuery"
    )

    aggResponse = {
      max: {
        age: 10
      }
    }
    // @ts-ignore
    expect(() => transformAggregateResponse(aggResponse, { last: 'lastName' })).toThrow(
      "No corresponding field found for 'age' when transforming aggregateQuery"
    )
  })
})

describe('applySort', () => {
  type TestCase = { description: string; sortFields: SortField<TestDTO>[]; input: TestDTO[]; expected: TestDTO[] }

  const date = (day: number): Date => new Date(`2020-1-${day}`)

  describe('sort asc', () => {
    const testCases: TestCase[] = [
      {
        description: 'sort strings asc',
        sortFields: [{ field: 'first', direction: SortDirection.ASC }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }],
        expected: [{ first: 'alice' }, { first: 'bob' }, { first: 'sally' }, { first: 'zane' }]
      },
      {
        description: 'sort strings with nulls asc',
        sortFields: [{ field: 'first', direction: SortDirection.ASC }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }, { first: null }, {}],
        expected: [{ first: 'alice' }, { first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: null }, {}]
      },
      {
        description: 'sort strings with nulls first asc',
        sortFields: [{ field: 'first', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }, { first: null }, {}],
        expected: [{}, { first: null }, { first: 'alice' }, { first: 'bob' }, { first: 'sally' }, { first: 'zane' }]
      },
      {
        description: 'sort strings with nulls last asc',
        sortFields: [{ field: 'first', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }, { first: null }, {}],
        expected: [{ first: 'alice' }, { first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: null }, {}]
      },
      {
        description: 'sort numbers asc',
        sortFields: [{ field: 'age', direction: SortDirection.ASC }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }],
        expected: [{ age: 30 }, { age: 31 }, { age: 32 }, { age: 33 }]
      },
      {
        description: 'sort numbers with nulls asc',
        sortFields: [{ field: 'age', direction: SortDirection.ASC }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }, { age: null }, {}],
        expected: [{ age: 30 }, { age: 31 }, { age: 32 }, { age: 33 }, { age: null }, {}]
      },
      {
        description: 'sort numbers with nulls first asc',
        sortFields: [{ field: 'age', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }, { age: null }, {}],
        expected: [{}, { age: null }, { age: 30 }, { age: 31 }, { age: 32 }, { age: 33 }]
      },
      {
        description: 'sort numbers with nulls last asc',
        sortFields: [{ field: 'age', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }, { age: null }, {}],
        expected: [{ age: 30 }, { age: 31 }, { age: 32 }, { age: 33 }, { age: null }, {}]
      },
      {
        description: 'sort booleans asc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.ASC }],
        input: [{ isVerified: true }, { isVerified: false }, { isVerified: false }, { isVerified: true }],
        expected: [{ isVerified: false }, { isVerified: false }, { isVerified: true }, { isVerified: true }]
      },
      {
        description: 'sort booleans with nulls asc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.ASC }],
        input: [
          { isVerified: true },
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: null },
          {}
        ],
        expected: [
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: true },
          { isVerified: null },
          {}
        ]
      },
      {
        description: 'sort booleans with nulls first asc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }],
        input: [
          { isVerified: true },
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: null },
          {}
        ],
        expected: [
          {},
          { isVerified: null },
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: true }
        ]
      },
      {
        description: 'sort booleans with nulls last asc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
        input: [
          { isVerified: true },
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: null },
          {}
        ],
        expected: [
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: true },
          { isVerified: null },
          {}
        ]
      },
      {
        description: 'sort dates asc',
        sortFields: [{ field: 'created', direction: SortDirection.ASC }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }],
        expected: [{ created: date(1) }, { created: date(2) }, { created: date(3) }, { created: date(4) }]
      },
      {
        description: 'sort dates with nulls asc',
        sortFields: [{ field: 'created', direction: SortDirection.ASC }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }, { created: null }, {}],
        expected: [{ created: date(1) }, { created: date(2) }, { created: date(3) }, { created: date(4) }, { created: null }, {}]
      },
      {
        description: 'sort dates with nulls first asc',
        sortFields: [{ field: 'created', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }, { created: null }, {}],
        expected: [{}, { created: null }, { created: date(1) }, { created: date(2) }, { created: date(3) }, { created: date(4) }]
      },
      {
        description: 'sort dates with nulls last asc',
        sortFields: [{ field: 'created', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }, { created: null }, {}],
        expected: [{ created: date(1) }, { created: date(2) }, { created: date(3) }, { created: date(4) }, { created: null }, {}]
      }
    ]
    testCases.forEach(({ description, input, expected, sortFields }) => {
      it(`should ${description}`, () => {
        expect(applySort(input, sortFields)).toEqual(expected)
      })
    })
  })

  describe('should sort desc', () => {
    const testCases: TestCase[] = [
      {
        description: 'sort strings desc',
        sortFields: [{ field: 'first', direction: SortDirection.DESC }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }],
        expected: [{ first: 'zane' }, { first: 'sally' }, { first: 'bob' }, { first: 'alice' }]
      },
      {
        description: 'sort strings with nulls desc',
        sortFields: [{ field: 'first', direction: SortDirection.DESC }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }, { first: null }, {}],
        expected: [{}, { first: null }, { first: 'zane' }, { first: 'sally' }, { first: 'bob' }, { first: 'alice' }]
      },
      {
        description: 'sort strings with nulls first desc',
        sortFields: [{ field: 'first', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }, { first: null }, {}],
        expected: [{}, { first: null }, { first: 'zane' }, { first: 'sally' }, { first: 'bob' }, { first: 'alice' }]
      },
      {
        description: 'sort strings with nulls last desc',
        sortFields: [{ field: 'first', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }],
        input: [{ first: 'bob' }, { first: 'sally' }, { first: 'zane' }, { first: 'alice' }, { first: null }, {}],
        expected: [{ first: 'zane' }, { first: 'sally' }, { first: 'bob' }, { first: 'alice' }, { first: null }, {}]
      },
      {
        description: 'sort numbers desc',
        sortFields: [{ field: 'age', direction: SortDirection.DESC }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }],
        expected: [{ age: 33 }, { age: 32 }, { age: 31 }, { age: 30 }]
      },
      {
        description: 'sort numbers with nulls desc',
        sortFields: [{ field: 'age', direction: SortDirection.DESC }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }, { age: null }, {}],
        expected: [{}, { age: null }, { age: 33 }, { age: 32 }, { age: 31 }, { age: 30 }]
      },
      {
        description: 'sort numbers with nulls first desc',
        sortFields: [{ field: 'age', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }, { age: null }, {}],
        expected: [{}, { age: null }, { age: 33 }, { age: 32 }, { age: 31 }, { age: 30 }]
      },
      {
        description: 'sort numbers with nulls last desc',
        sortFields: [{ field: 'age', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }],
        input: [{ age: 30 }, { age: 33 }, { age: 31 }, { age: 32 }, { age: null }, {}],
        expected: [{ age: 33 }, { age: 32 }, { age: 31 }, { age: 30 }, { age: null }, {}]
      },
      {
        description: 'sort booleans desc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.DESC }],
        input: [{ isVerified: true }, { isVerified: false }, { isVerified: false }, { isVerified: true }],
        expected: [{ isVerified: true }, { isVerified: true }, { isVerified: false }, { isVerified: false }]
      },
      {
        description: 'sort booleans with nulls desc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.DESC }],
        input: [
          { isVerified: true },
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: null },
          {}
        ],
        expected: [
          {},
          { isVerified: null },
          { isVerified: true },
          { isVerified: true },
          { isVerified: false },
          { isVerified: false }
        ]
      },
      {
        description: 'sort booleans with nulls first desc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }],
        input: [
          { isVerified: true },
          { isVerified: false },
          { isVerified: false },
          { isVerified: true },
          { isVerified: null },
          {}
        ],
        expected: [
          {},
          { isVerified: null },
          { isVerified: true },
          { isVerified: true },
          { isVerified: false },
          { isVerified: false }
        ]
      },
      {
        description: 'sort booleans with nulls last desc',
        sortFields: [{ field: 'isVerified', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }],
        input: [
          { isVerified: true },
          { isVerified: true },
          { isVerified: null },
          { isVerified: false },
          { isVerified: false },
          {}
        ],
        expected: [
          { isVerified: true },
          { isVerified: true },
          { isVerified: false },
          { isVerified: false },
          { isVerified: null },
          {}
        ]
      },
      {
        description: 'sort dates desc',
        sortFields: [{ field: 'created', direction: SortDirection.DESC }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }],
        expected: [{ created: date(4) }, { created: date(3) }, { created: date(2) }, { created: date(1) }]
      },
      {
        description: 'sort dates with nulls desc',
        sortFields: [{ field: 'created', direction: SortDirection.DESC }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }, { created: null }, {}],
        expected: [{}, { created: null }, { created: date(4) }, { created: date(3) }, { created: date(2) }, { created: date(1) }]
      },
      {
        description: 'sort dates with nulls first desc',
        sortFields: [{ field: 'created', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }, { created: null }, {}],
        expected: [{}, { created: null }, { created: date(4) }, { created: date(3) }, { created: date(2) }, { created: date(1) }]
      },
      {
        description: 'sort dates with nulls last desc',
        sortFields: [{ field: 'created', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }],
        input: [{ created: date(4) }, { created: date(2) }, { created: date(3) }, { created: date(1) }, { created: null }, {}],
        expected: [{ created: date(4) }, { created: date(3) }, { created: date(2) }, { created: date(1) }, { created: null }, {}]
      }
    ]
    testCases.forEach(({ description, input, expected, sortFields }) => {
      it(`should ${description}`, () => {
        expect(applySort(input, sortFields)).toEqual(expected)
      })
    })
  })

  describe('multi sort', () => {
    const testCases: TestCase[] = [
      {
        description: 'sort multiple fields asc',
        sortFields: [
          { field: 'first', direction: SortDirection.ASC },
          { field: 'last', direction: SortDirection.ASC }
        ],
        input: [
          { first: 'd', last: 'a' },
          { first: 'a', last: 'a' },
          { first: 'b', last: 'a' },
          { first: 'c', last: 'a' },
          { first: 'd', last: 'b' },
          { first: 'a', last: 'b' },
          { first: 'c', last: 'b' },
          { first: 'b', last: 'b' },
          { first: 'd', last: 'c' },
          { first: 'c', last: 'c' },
          { first: 'a', last: 'c' },
          { first: 'b', last: 'c' }
        ],
        expected: [
          { first: 'a', last: 'a' },
          { first: 'a', last: 'b' },
          { first: 'a', last: 'c' },
          { first: 'b', last: 'a' },
          { first: 'b', last: 'b' },
          { first: 'b', last: 'c' },
          { first: 'c', last: 'a' },
          { first: 'c', last: 'b' },
          { first: 'c', last: 'c' },
          { first: 'd', last: 'a' },
          { first: 'd', last: 'b' },
          { first: 'd', last: 'c' }
        ]
      },
      {
        description: 'sort multiple fields desc',
        sortFields: [
          { field: 'first', direction: SortDirection.DESC },
          { field: 'last', direction: SortDirection.DESC }
        ],
        input: [
          { first: 'd', last: 'a' },
          { first: 'a', last: 'a' },
          { first: 'b', last: 'a' },
          { first: 'c', last: 'a' },
          { first: 'd', last: 'b' },
          { first: 'a', last: 'b' },
          { first: 'c', last: 'b' },
          { first: 'b', last: 'b' },
          { first: 'd', last: 'c' },
          { first: 'c', last: 'c' },
          { first: 'a', last: 'c' },
          { first: 'b', last: 'c' }
        ],
        expected: [
          { first: 'd', last: 'c' },
          { first: 'd', last: 'b' },
          { first: 'd', last: 'a' },
          { first: 'c', last: 'c' },
          { first: 'c', last: 'b' },
          { first: 'c', last: 'a' },
          { first: 'b', last: 'c' },
          { first: 'b', last: 'b' },
          { first: 'b', last: 'a' },
          { first: 'a', last: 'c' },
          { first: 'a', last: 'b' },
          { first: 'a', last: 'a' }
        ]
      },
      {
        description: 'sort multiple fields asc and desc',
        sortFields: [
          { field: 'first', direction: SortDirection.DESC },
          { field: 'last', direction: SortDirection.ASC }
        ],
        input: [
          { first: 'd', last: 'a' },
          { first: 'a', last: 'a' },
          { first: 'b', last: 'a' },
          { first: 'c', last: 'a' },
          { first: 'd', last: 'b' },
          { first: 'a', last: 'b' },
          { first: 'c', last: 'b' },
          { first: 'b', last: 'b' },
          { first: 'd', last: 'c' },
          { first: 'c', last: 'c' },
          { first: 'a', last: 'c' },
          { first: 'b', last: 'c' }
        ],
        expected: [
          { first: 'd', last: 'a' },
          { first: 'd', last: 'b' },
          { first: 'd', last: 'c' },
          { first: 'c', last: 'a' },
          { first: 'c', last: 'b' },
          { first: 'c', last: 'c' },
          { first: 'b', last: 'a' },
          { first: 'b', last: 'b' },
          { first: 'b', last: 'c' },
          { first: 'a', last: 'a' },
          { first: 'a', last: 'b' },
          { first: 'a', last: 'c' }
        ]
      },
      {
        description: 'sort multiple fields asc nulls first and desc nulls last',
        sortFields: [
          { field: 'first', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST },
          { field: 'last', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }
        ],
        input: [
          { first: 'd' },
          { first: 'a' },
          { first: 'b' },
          { first: 'c', last: null },
          { first: 'a', last: 'a' },
          { first: 'c', last: 'b' },
          { first: 'b', last: 'b' },
          { first: 'c' },
          { first: 'a', last: null },
          { first: 'c', last: 'c' },
          { last: 'a' },
          { first: 'd', last: 'a' },
          { last: null },
          { first: 'd', last: 'b' },
          { last: 'b' },
          {},
          { last: 'c' },
          { first: 'b', last: 'c' },
          { first: 'd', last: 'c' },
          { first: 'b', last: 'a' },
          { first: 'a', last: 'b' },
          { first: 'd', last: null },
          { first: 'b', last: null },
          { first: 'a', last: 'c' },
          { first: 'c', last: 'a' }
        ],
        expected: [
          { first: 'd' },
          { first: 'd', last: null },
          { first: 'd', last: 'a' },
          { first: 'd', last: 'b' },
          { first: 'd', last: 'c' },
          { first: 'c' },
          { first: 'c', last: null },
          { first: 'c', last: 'a' },
          { first: 'c', last: 'b' },
          { first: 'c', last: 'c' },
          { first: 'b' },
          { first: 'b', last: null },
          { first: 'b', last: 'a' },
          { first: 'b', last: 'b' },
          { first: 'b', last: 'c' },
          { first: 'a' },
          { first: 'a', last: null },
          { first: 'a', last: 'a' },
          { first: 'a', last: 'b' },
          { first: 'a', last: 'c' },
          {},
          { last: null },
          { last: 'a' },
          { last: 'b' },
          { last: 'c' }
        ]
      },
      {
        description: 'sort multiple fields with all first columns null',
        sortFields: [
          { field: 'first', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST },
          { field: 'last', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }
        ],
        input: [{ last: 'a' }, { last: null }, { last: 'b' }, {}, { last: 'c' }],
        expected: [{}, { last: null }, { last: 'a' }, { last: 'b' }, { last: 'c' }]
      }
    ]
    testCases.forEach(({ description, input, expected, sortFields }) => {
      it(`should ${description}`, () => {
        expect(applySort(input, sortFields)).toEqual(expected)
      })
    })
  })
})

describe('applyPaging', () => {
  type TestCase = { description: string; paging: Paging; input: TestDTO[]; expected: TestDTO[] }
  const testCases: TestCase[] = [
    {
      description: 'return all elements if paging is empty',
      paging: {},
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ]
    },
    {
      description: 'apply a limit',
      paging: { limit: 3 },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' }
      ]
    },
    {
      description: 'apply an offset',
      paging: { offset: 2 },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ]
    },
    {
      description: 'apply a limit and offset',
      paging: { offset: 1, limit: 2 },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' }
      ]
    }
  ]
  testCases.forEach(({ description, input, expected, paging }) => {
    it(`should ${description}`, () => {
      expect(applyPaging(input, paging)).toEqual(expected)
    })
  })
})

describe('applyQuery', () => {
  type TestCase = { description: string; query: Query<TestDTO>; input: TestDTO[]; expected: TestDTO[] }
  const testCases: TestCase[] = [
    {
      description: 'return all elements if the query is empty',
      query: {},
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ]
    },
    {
      description: 'apply a filter',
      query: { filter: { first: { in: ['bob', 'alice'] } } },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'bob', last: 'yukon' },
        { first: 'alice', last: 'yukon' }
      ]
    },
    {
      description: 'apply sorting',
      query: { sorting: [{ field: 'first', direction: SortDirection.ASC }] },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'alice', last: 'yukon' },
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ]
    },
    {
      description: 'apply paging',
      query: { paging: { offset: 1, limit: 2 } },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'zane', last: 'yukon' }
      ],
      expected: [
        { first: 'sally', last: 'yukon' },
        { first: 'alice', last: 'yukon' }
      ]
    },
    {
      description: 'apply filter, sorting and paging',
      query: {
        filter: { first: { in: ['bob', 'sally', 'alice', 'zane'] } },
        sorting: [{ field: 'first', direction: SortDirection.DESC }],
        paging: { offset: 1, limit: 2 }
      },
      input: [
        { first: 'bob', last: 'yukon' },
        { first: 'bill', last: 'yukon' },
        { first: 'sally', last: 'yukon' },
        { first: 'sue', last: 'yukon' },
        { first: 'alice', last: 'yukon' },
        { first: 'alex', last: 'yukon' },
        { first: 'zane', last: 'yukon' },
        { first: 'zeb', last: 'yukon' }
      ],
      expected: [
        { first: 'sally', last: 'yukon' },
        { first: 'bob', last: 'yukon' }
      ]
    }
  ]
  testCases.forEach(({ description, input, expected, query }) => {
    it(`should ${description}`, () => {
      expect(applyQuery(input, query)).toEqual(expected)
    })
  })
})

describe('getFilterComparisons', () => {
  type Foo = {
    bar: number
    baz: number
  }

  it('should get list of comparisons from a filter given a key', () => {
    const f0: Filter<Foo> = {}
    const f1: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 1 }
    }
    const f2: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 1 },
      and: [{ baz: { lt: 2 }, bar: { lt: 3 } }]
    }
    const f3: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 1 },
      or: [{ baz: { lt: 4 }, bar: { lt: 5 } }]
    }
    const f4: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 1 },
      and: [{ baz: { lt: 2 }, bar: { lt: 3 } }],
      or: [{ baz: { lt: 4 }, bar: { lt: 5 } }]
    }
    expect(getFilterComparisons(f0, 'bar')).toEqual(expect.arrayContaining([]))
    expect(getFilterComparisons(f1, 'bar')).toEqual(expect.arrayContaining([{ gt: 0 }]))
    expect(getFilterComparisons(f2, 'bar')).toEqual(expect.arrayContaining([{ gt: 0 }, { lt: 3 }]))
    expect(getFilterComparisons(f3, 'bar')).toEqual(expect.arrayContaining([{ gt: 0 }, { lt: 5 }]))
    expect(getFilterComparisons(f4, 'bar')).toEqual(expect.arrayContaining([{ gt: 0 }, { lt: 3 }, { lt: 5 }]))
  })
})

describe('transformFilterComparisons', () => {
  type Foo = {
    bar: number
    baz: number
  }

  it('should transform filter comparisons back to valid filter', () => {
    const f0: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 1 }
    }
    expect(getFilterComparisons(f0, 'bar')).toEqual(expect.arrayContaining([{ gt: 0 }]))
    expect(transformFilterComparisons<Foo, 'bar'>(getFilterComparisons(f0, 'bar'), 'bar')).toEqual({ bar: { gt: 0 } })
  })
})

describe('getFilterOmitting', () => {
  type Foo = {
    bar: number
    baz: number
  }

  it('should omit a key from a filter', () => {
    const filter: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 0 },
      and: [{ baz: { lt: 100 }, bar: { lt: 100 } }],
      or: [{ baz: { lt: 100 }, bar: { lt: 100 } }]
    }
    expect(getFilterOmitting(filter, 'baz')).toEqual({
      bar: { gt: 0 },
      and: [{ bar: { lt: 100 } }],
      or: [{ bar: { lt: 100 } }]
    })
  })

  it('should delete and and or properties if they are empty after omitting', () => {
    const filter: Filter<Foo> = {
      bar: { gt: 0 },
      baz: { gt: 0 },
      and: [{ baz: { lt: 100 } }],
      or: [{ baz: { lt: 100 } }]
    }
    expect(getFilterOmitting(filter, 'baz')).toEqual({
      bar: { gt: 0 }
    })
  })
})

describe('mergeFilter', () => {
  type Foo = {
    bar: number
    baz: number
  }

  it('should merge two filters', () => {
    const f1: Filter<Foo> = {
      bar: { gt: 0 }
    }
    const f2: Filter<Foo> = {
      baz: { gt: 0 }
    }
    expect(mergeFilter(f1, f2)).toEqual({
      and: expect.arrayContaining([f1, f2])
    })
  })

  it('should noop if one of the filters is empty', () => {
    const filter: Filter<Foo> = {
      bar: { gt: 0 }
    }
    expect(mergeFilter(filter, {})).toEqual(filter)
    expect(mergeFilter({}, filter)).toEqual(filter)
  })
})

describe('mergeFilters', () => {
  type Foo = {
    bar: number
    baz: number
  }

  it('should merge three filters', () => {
    const f1: Filter<Foo> = {
      bar: { gt: 0 }
    }
    const f2: Filter<Foo> = {
      baz: { gt: 0 }
    }
    const f3: Filter<Foo> = {
      baz: { lt: 0 }
    }
    expect(mergeFilters(f1, f2, f3)).toEqual({
      and: expect.arrayContaining([f1, f2, f3])
    })
  })

  it('should noop if one of the filters is empty', () => {
    const filter: Filter<Foo> = {
      bar: { gt: 0 }
    }
    expect(mergeFilters(filter, {})).toEqual({ and: [filter] })
    expect(mergeFilters({}, filter)).toEqual({ and: [filter] })
  })
})

describe('ensureMatchesCreationFilter', () => {
  const filter: Filter<TestDTO> = { first: { eq: 'foo' } }

  it('should do nothing when the filter is undefined', () => {
    expect(() => ensureMatchesCreationFilter({ first: 'bar' }, undefined)).not.toThrow()
  })

  it('should do nothing when the record matches the filter', () => {
    expect(() => ensureMatchesCreationFilter({ first: 'foo' }, filter)).not.toThrow()
  })

  it('should throw a BadRequestException when the record does not match the filter', () => {
    expect(() => ensureMatchesCreationFilter({ first: 'bar' }, filter)).toThrow(
      new BadRequestException('Entity does not meet creation constraints')
    )
  })
})

describe('filterCreatableRecords', () => {
  const filter: Filter<TestDTO> = { first: { eq: 'foo' } }

  it('should return the records unchanged when the filter is undefined', () => {
    const records: TestDTO[] = [{ first: 'foo' }, { first: 'bar' }]
    expect(filterCreatableRecords(records, undefined)).toBe(records)
  })

  it('should return only the records matching the filter', () => {
    const matchingRecord: TestDTO = { first: 'foo' }
    const nonMatchingRecord: TestDTO = { first: 'bar' }
    expect(filterCreatableRecords([matchingRecord, nonMatchingRecord], filter)).toEqual([matchingRecord])
  })

  it('should return all records when every record matches the filter', () => {
    const records: TestDTO[] = [{ first: 'foo' }, { first: 'foo' }, { first: 'foo' }]
    expect(filterCreatableRecords(records, filter)).toEqual(records)
  })
})
