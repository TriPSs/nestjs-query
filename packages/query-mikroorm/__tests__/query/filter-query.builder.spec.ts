import { SortDirection, SortNulls } from '@ptc-org/nestjs-query-core'
import { MikroORM } from '@mikro-orm/core'
import { SqliteDriver } from '@mikro-orm/sqlite'

import { FilterQueryBuilder } from '../../src/query'
import { createTestConnection } from '../__fixtures__/connection.fixture'
import { TestEntity } from '../__fixtures__/test.entity'

describe('FilterQueryBuilder', () => {
  let orm: MikroORM<SqliteDriver>
  let filterQueryBuilder: FilterQueryBuilder<TestEntity>

  beforeAll(async () => {
    orm = await createTestConnection()
    const metadata = orm.em.getMetadata().get(TestEntity.name)
    filterQueryBuilder = new FilterQueryBuilder<TestEntity>(metadata)
  })

  afterAll(async () => {
    await orm.close(true)
  })

  describe('#buildFilter', () => {
    it('should return empty object for undefined filter', () => {
      const result = filterQueryBuilder.buildFilter(undefined)
      expect(result).toEqual({})
    })

    it('should convert eq filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { eq: 'foo' } })
      expect(result).toEqual({ stringType: { $eq: 'foo' } })
    })

    it('should convert neq filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { neq: 'foo' } })
      expect(result).toEqual({ stringType: { $ne: 'foo' } })
    })

    it('should convert gt filter', () => {
      const result = filterQueryBuilder.buildFilter({ numberType: { gt: 5 } })
      expect(result).toEqual({ numberType: { $gt: 5 } })
    })

    it('should convert gte filter', () => {
      const result = filterQueryBuilder.buildFilter({ numberType: { gte: 5 } })
      expect(result).toEqual({ numberType: { $gte: 5 } })
    })

    it('should convert lt filter', () => {
      const result = filterQueryBuilder.buildFilter({ numberType: { lt: 5 } })
      expect(result).toEqual({ numberType: { $lt: 5 } })
    })

    it('should convert lte filter', () => {
      const result = filterQueryBuilder.buildFilter({ numberType: { lte: 5 } })
      expect(result).toEqual({ numberType: { $lte: 5 } })
    })

    it('should convert in filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { in: ['foo', 'bar'] } })
      expect(result).toEqual({ stringType: { $in: ['foo', 'bar'] } })
    })

    it('should convert notIn filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { notIn: ['foo', 'bar'] } })
      expect(result).toEqual({ stringType: { $nin: ['foo', 'bar'] } })
    })

    it('should convert like filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { like: '%foo%' } })
      expect(result).toEqual({ stringType: { $like: '%foo%' } })
    })

    it('should convert iLike filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { iLike: '%foo%' } })
      expect(result).toEqual({ stringType: { $ilike: '%foo%' } })
    })

    it('should convert is filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { is: null } })
      expect(result).toEqual({ stringType: { $eq: null } })
    })

    it('should convert isNot filter', () => {
      const result = filterQueryBuilder.buildFilter({ stringType: { isNot: null } })
      expect(result).toEqual({ stringType: { $ne: null } })
    })

    it('should convert and filter', () => {
      const result = filterQueryBuilder.buildFilter({
        and: [{ stringType: { eq: 'foo' } }, { numberType: { gt: 5 } }]
      })
      expect(result).toEqual({
        $and: [{ stringType: { $eq: 'foo' } }, { numberType: { $gt: 5 } }]
      })
    })

    it('should convert or filter', () => {
      const result = filterQueryBuilder.buildFilter({
        or: [{ stringType: { eq: 'foo' } }, { numberType: { gt: 5 } }]
      })
      expect(result).toEqual({
        $or: [{ stringType: { $eq: 'foo' } }, { numberType: { $gt: 5 } }]
      })
    })

    it('should convert nested filters', () => {
      const result = filterQueryBuilder.buildFilter({
        and: [{ stringType: { eq: 'foo' } }, { or: [{ numberType: { gt: 5 } }, { boolType: { is: true } }] }]
      })
      expect(result).toEqual({
        $and: [{ stringType: { $eq: 'foo' } }, { $or: [{ numberType: { $gt: 5 } }, { boolType: { $eq: true } }] }]
      })
    })
  })

  describe('#buildSorting', () => {
    it('should convert ASC sorting', () => {
      const result = filterQueryBuilder.buildSorting([{ field: 'stringType', direction: SortDirection.ASC }])
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('stringType')
    })

    it('should convert DESC sorting', () => {
      const result = filterQueryBuilder.buildSorting([{ field: 'stringType', direction: SortDirection.DESC }])
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('stringType')
    })

    it('should handle NULLS_FIRST', () => {
      const result = filterQueryBuilder.buildSorting([
        { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }
      ])
      expect(result).toHaveLength(1)
    })

    it('should handle NULLS_LAST', () => {
      const result = filterQueryBuilder.buildSorting([
        { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }
      ])
      expect(result).toHaveLength(1)
    })

    it('should handle multiple sorts', () => {
      const result = filterQueryBuilder.buildSorting([
        { field: 'stringType', direction: SortDirection.ASC },
        { field: 'numberType', direction: SortDirection.DESC }
      ])
      expect(result).toHaveLength(2)
    })
  })

  describe('#buildQuery', () => {
    it('should build a complete query', () => {
      const { where, options } = filterQueryBuilder.buildQuery({
        filter: { stringType: { eq: 'foo' } },
        paging: { limit: 10, offset: 5 },
        sorting: [{ field: 'numberType', direction: SortDirection.ASC }]
      })

      expect(where).toEqual({ stringType: { $eq: 'foo' } })
      expect(options.limit).toBe(10)
      expect(options.offset).toBe(5)
      expect(options.orderBy).toHaveLength(1)
    })

    it('should handle empty query', () => {
      const { where, options } = filterQueryBuilder.buildQuery({})
      expect(where).toEqual({})
      expect(options).toEqual({})
    })
  })
})
