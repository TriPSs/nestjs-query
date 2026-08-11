import { BetterSqliteDriver } from '@mikro-orm/better-sqlite'
import { EntityRepository, MikroORM } from '@mikro-orm/core'
import { SortDirection, SortNulls } from '@ptc-org/nestjs-query-core'

import { MikroOrmQueryService } from '../../src'
import { createTestConnection, refresh, TEST_ENTITIES, TEST_RELATIONS, TestEntity, TestRelation } from '../__fixtures__'

describe('MikroOrmQueryService', () => {
  let orm: MikroORM<BetterSqliteDriver>
  let testEntityRepo: EntityRepository<TestEntity>
  let testRelationRepo: EntityRepository<TestRelation>
  let queryService: MikroOrmQueryService<TestEntity>
  let relationQueryService: MikroOrmQueryService<TestRelation>

  beforeAll(async () => {
    orm = await createTestConnection()
  })

  afterAll(async () => {
    await orm.close()
  })

  beforeEach(async () => {
    await refresh(orm)
    const em = orm.em.fork()
    testEntityRepo = em.getRepository(TestEntity)
    testRelationRepo = em.getRepository(TestRelation)
    queryService = new MikroOrmQueryService(testEntityRepo)
    relationQueryService = new MikroOrmQueryService(testRelationRepo)
  })

  describe('#query', () => {
    it('should return all entities when no filter is provided', async () => {
      const result = await queryService.query({})
      expect(result).toHaveLength(TEST_ENTITIES.length)
    })

    it('should filter by eq operator', async () => {
      const result = await queryService.query({ filter: { stringType: { eq: 'foo1' } } })
      expect(result).toHaveLength(1)
      expect(result[0].stringType).toBe('foo1')
    })

    it('should filter by neq operator', async () => {
      const result = await queryService.query({ filter: { stringType: { neq: 'foo1' } } })
      expect(result).toHaveLength(TEST_ENTITIES.length - 1)
      expect(result.every((e) => e.stringType !== 'foo1')).toBe(true)
    })

    it('should filter by gt operator', async () => {
      const result = await queryService.query({ filter: { numberType: { gt: 5 } } })
      expect(result).toHaveLength(5)
      expect(result.every((e) => e.numberType > 5)).toBe(true)
    })

    it('should filter by gte operator', async () => {
      const result = await queryService.query({ filter: { numberType: { gte: 5 } } })
      expect(result).toHaveLength(6)
      expect(result.every((e) => e.numberType >= 5)).toBe(true)
    })

    it('should filter by lt operator', async () => {
      const result = await queryService.query({ filter: { numberType: { lt: 5 } } })
      expect(result).toHaveLength(4)
      expect(result.every((e) => e.numberType < 5)).toBe(true)
    })

    it('should filter by lte operator', async () => {
      const result = await queryService.query({ filter: { numberType: { lte: 5 } } })
      expect(result).toHaveLength(5)
      expect(result.every((e) => e.numberType <= 5)).toBe(true)
    })

    it('should filter by in operator', async () => {
      const result = await queryService.query({ filter: { numberType: { in: [1, 2, 3] } } })
      expect(result).toHaveLength(3)
      expect(result.map((e) => e.numberType).sort()).toEqual([1, 2, 3])
    })

    it('should filter by notIn operator', async () => {
      const result = await queryService.query({ filter: { numberType: { notIn: [1, 2, 3] } } })
      expect(result).toHaveLength(7)
      expect(result.every((e) => ![1, 2, 3].includes(e.numberType))).toBe(true)
    })

    it('should filter by like operator', async () => {
      const result = await queryService.query({ filter: { stringType: { like: 'foo%' } } })
      expect(result).toHaveLength(TEST_ENTITIES.length)
    })

    it('should filter by like operator with specific pattern', async () => {
      const result = await queryService.query({ filter: { stringType: { like: 'foo1%' } } })
      expect(result).toHaveLength(2) // foo1 and foo10
    })

    it('should filter by is operator (null check)', async () => {
      const result = await queryService.query({ filter: { boolType: { is: true } } })
      expect(result).toHaveLength(5)
      expect(result.every((e) => e.boolType === true)).toBe(true)
    })

    it('should filter by isNot operator', async () => {
      const result = await queryService.query({ filter: { boolType: { isNot: true } } })
      expect(result).toHaveLength(5)
      expect(result.every((e) => e.boolType !== true)).toBe(true)
    })

    it('should filter with AND conditions', async () => {
      const result = await queryService.query({
        filter: {
          and: [{ numberType: { gt: 3 } }, { numberType: { lt: 7 } }]
        }
      })
      expect(result).toHaveLength(3)
      expect(result.every((e) => e.numberType > 3 && e.numberType < 7)).toBe(true)
    })

    it('should filter with OR conditions', async () => {
      const result = await queryService.query({
        filter: {
          or: [{ numberType: { eq: 1 } }, { numberType: { eq: 10 } }]
        }
      })
      expect(result).toHaveLength(2)
      expect(result.map((e) => e.numberType).sort((a, b) => a - b)).toEqual([1, 10])
    })

    it('should apply paging with limit', async () => {
      const result = await queryService.query({
        paging: { limit: 3 }
      })
      expect(result).toHaveLength(3)
    })

    it('should apply paging with offset', async () => {
      const result = await queryService.query({
        paging: { offset: 5, limit: 3 },
        sorting: [{ field: 'numberType', direction: SortDirection.ASC }]
      })
      expect(result).toHaveLength(3)
      expect(result[0].numberType).toBe(6)
    })

    it('should sort ascending', async () => {
      const result = await queryService.query({
        sorting: [{ field: 'numberType', direction: SortDirection.ASC }]
      })
      expect(result[0].numberType).toBe(1)
      expect(result[result.length - 1].numberType).toBe(10)
    })

    it('should sort descending', async () => {
      const result = await queryService.query({
        sorting: [{ field: 'numberType', direction: SortDirection.DESC }]
      })
      expect(result[0].numberType).toBe(10)
      expect(result[result.length - 1].numberType).toBe(1)
    })

    it('should sort with nulls first', async () => {
      const result = await queryService.query({
        sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }]
      })
      expect(result[0].numberType).toBe(1)
    })

    it('should sort with nulls last', async () => {
      const result = await queryService.query({
        sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }]
      })
      expect(result[0].numberType).toBe(1)
    })
  })

  describe('#getById', () => {
    it('should find entity by id', async () => {
      const result = await queryService.getById('test-entity-1')
      expect(result.id).toBe('test-entity-1')
      expect(result.stringType).toBe('foo1')
    })

    it('should throw when entity not found', async () => {
      await expect(queryService.getById('non-existent')).rejects.toThrow()
    })

    it('should apply filter when getting by id', async () => {
      await expect(
        queryService.getById('test-entity-1', {
          filter: { numberType: { eq: 999 } }
        })
      ).rejects.toThrow()
    })
  })

  describe('#findById', () => {
    it('should find entity by id', async () => {
      const result = await queryService.findById('test-entity-1')
      expect(result).toBeDefined()
      expect(result?.id).toBe('test-entity-1')
    })

    it('should return undefined when entity not found', async () => {
      const result = await queryService.findById('non-existent')
      expect(result).toBeUndefined()
    })

    it('should apply filter when finding by id', async () => {
      const result = await queryService.findById('test-entity-1', {
        filter: { numberType: { eq: 999 } }
      })
      expect(result).toBeUndefined()
    })
  })

  describe('#count', () => {
    it('should return total count when no filter is provided', async () => {
      const count = await queryService.count({})
      expect(count).toBe(TEST_ENTITIES.length)
    })

    it('should count with eq filter', async () => {
      const count = await queryService.count({ stringType: { eq: 'foo1' } })
      expect(count).toBe(1)
    })

    it('should count with gt filter', async () => {
      const count = await queryService.count({ numberType: { gt: 5 } })
      expect(count).toBe(5)
    })

    it('should count with AND conditions', async () => {
      const count = await queryService.count({
        and: [{ numberType: { gt: 3 } }, { numberType: { lt: 7 } }]
      })
      expect(count).toBe(3)
    })

    it('should count with OR conditions', async () => {
      const count = await queryService.count({
        or: [{ numberType: { eq: 1 } }, { numberType: { eq: 10 } }]
      })
      expect(count).toBe(2)
    })

    it('should throw error for withDeleted option', async () => {
      await expect(queryService.count({}, { withDeleted: true })).rejects.toThrow(
        'MikroOrmQueryService does not support withDeleted on count'
      )
    })
  })

  describe('#findRelation', () => {
    it('should find a single relation for an entity', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relation = await queryService.findRelation(TestRelation, 'oneTestRelation', entity)
      expect(relation).toBeDefined()
      expect((relation as TestRelation).relationName).toContain('test-relation-one')
    })

    it('should find relations for multiple entities', async () => {
      const entities = await queryService.query({ filter: { numberType: { in: [1, 2] } } })
      const relations = await queryService.findRelation(TestRelation, 'oneTestRelation', entities)
      expect(relations).toBeInstanceOf(Map)
      expect((relations as Map<TestEntity, TestRelation>).size).toBe(2)
    })

    it('should return relation when filter matches', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relation = await queryService.findRelation(TestRelation, 'oneTestRelation', entity, {
        filter: { relationName: { like: '%one' } }
      })
      expect(relation).toBeDefined()
      expect((relation as TestRelation).relationName).toContain('test-relation-one')
    })

    it('should return undefined when filter does not match', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relation = await queryService.findRelation(TestRelation, 'oneTestRelation', entity, {
        filter: { relationName: { eq: 'non-existent' } }
      })
      expect(relation).toBeUndefined()
    })

    it('should apply filter when finding relations for multiple entities', async () => {
      const entities = await queryService.query({ filter: { numberType: { in: [1, 2] } } })
      const relations = await queryService.findRelation(TestRelation, 'oneTestRelation', entities, {
        filter: { relationName: { like: '%one' } }
      })
      expect(relations).toBeInstanceOf(Map)
      const map = relations as Map<TestEntity, TestRelation | undefined>
      expect(map.size).toBe(2)
      for (const [, rel] of map) {
        expect(rel).toBeDefined()
        expect(rel?.relationName).toContain('test-relation-one')
      }
    })

    it('should return undefined for entities where filter does not match', async () => {
      const entities = await queryService.query({ filter: { numberType: { in: [1, 2] } } })
      const relations = await queryService.findRelation(TestRelation, 'oneTestRelation', entities, {
        filter: { relationName: { eq: 'non-existent' } }
      })
      expect(relations).toBeInstanceOf(Map)
      const map = relations as Map<TestEntity, TestRelation | undefined>
      expect(map.size).toBe(2)
      for (const [, rel] of map) {
        expect(rel).toBeUndefined()
      }
    })
  })

  describe('#queryRelations', () => {
    it('should query relations for a single entity', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {})
      expect(Array.isArray(relations)).toBe(true)
      expect(relations).toHaveLength(3)
    })

    it('should query relations for multiple entities', async () => {
      const entities = await queryService.query({ filter: { numberType: { in: [1, 2] } } })
      const relations = await queryService.queryRelations(TestRelation, 'testRelations', entities, {})
      expect(relations).toBeInstanceOf(Map)
      const map = relations
      expect(map.size).toBe(2)
      for (const [, rels] of map) {
        expect(rels).toHaveLength(3)
      }
    })

    it('should apply filter to relations query', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {
        filter: { relationName: { like: '%one' } }
      })
      expect(relations).toHaveLength(1)
      expect(relations[0].relationName).toContain('one')
    })

    it('should apply paging to relations query', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {
        paging: { limit: 2 }
      })
      expect(relations).toHaveLength(2)
    })

    it('should apply sorting to relations query', async () => {
      const entity = await queryService.getById('test-entity-1')
      const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {
        sorting: [{ field: 'relationName', direction: SortDirection.DESC }]
      })
      const sorted = relations
      expect(sorted[0].relationName).toContain('two')
    })
  })

  describe('#countRelations', () => {
    it('should count relations for a single entity', async () => {
      const entity = await queryService.getById('test-entity-1')
      const count = await queryService.countRelations(TestRelation, 'testRelations', entity, {})
      expect(count).toBe(3)
    })

    it('should count relations for multiple entities', async () => {
      const entities = await queryService.query({ filter: { numberType: { in: [1, 2] } } })
      const counts = await queryService.countRelations(TestRelation, 'testRelations', entities, {})
      expect(counts).toBeInstanceOf(Map)
      const map = counts
      expect(map.size).toBe(2)
      for (const [, count] of map) {
        expect(count).toBe(3)
      }
    })

    it('should apply filter when counting relations', async () => {
      const entity = await queryService.getById('test-entity-1')
      const count = await queryService.countRelations(TestRelation, 'testRelations', entity, {
        relationName: { like: '%one' }
      })
      expect(count).toBe(1)
    })
  })

  describe('filter conversion', () => {
    it('should throw error when filter has both and/or and other properties', async () => {
      await expect(
        queryService.query({
          filter: {
            and: [{ numberType: { eq: 1 } }],
            numberType: { eq: 2 }
          } as never
        })
      ).rejects.toThrow('filter must contain either only `and` or `or` property, or other properties')
    })
  })

  describe('#createOne', () => {
    it('should create a new entity and persist to database', async () => {
      const result = await queryService.createOne({
        id: 'new-entity-1',
        stringType: 'new-entity',
        boolType: true,
        numberType: 100,
        dateType: new Date()
      })
      expect(result.stringType).toBe('new-entity')
      expect(result.numberType).toBe(100)
      expect(result.id).toBe('new-entity-1')

      const found = await queryService.findById('new-entity-1')
      expect(found).toBeDefined()
      expect(found?.stringType).toBe('new-entity')
    })
  })

  describe('#createMany', () => {
    it('should create multiple entities and persist to database', async () => {
      const result = await queryService.createMany([
        { id: 'batch-entity-1', stringType: 'batch-1', boolType: true, numberType: 101, dateType: new Date() },
        { id: 'batch-entity-2', stringType: 'batch-2', boolType: false, numberType: 102, dateType: new Date() }
      ])
      expect(result).toHaveLength(2)
      expect(result[0].stringType).toBe('batch-1')
      expect(result[1].stringType).toBe('batch-2')

      const count = await queryService.count({ stringType: { like: 'batch-%' } })
      expect(count).toBe(2)
    })
  })

  describe('#updateOne', () => {
    it('should update an existing entity and persist changes', async () => {
      const result = await queryService.updateOne('test-entity-1', { stringType: 'updated-foo' })
      expect(result.stringType).toBe('updated-foo')
      expect(result.id).toBe('test-entity-1')

      const found = await queryService.findById('test-entity-1')
      expect(found?.stringType).toBe('updated-foo')
    })

    it('should throw when entity not found', async () => {
      await expect(queryService.updateOne('non-existent', { stringType: 'test' })).rejects.toThrow()
    })
  })

  describe('#updateMany', () => {
    it('should update multiple entities matching filter', async () => {
      const result = await queryService.updateMany({ boolType: false }, { numberType: { lt: 3 } })
      expect(result.updatedCount).toBe(2)
    })

    it('should persist changes to the database', async () => {
      await queryService.updateMany({ stringType: 'bulk-updated' }, { numberType: { in: [4, 5] } })
      const updated = await queryService.query({ filter: { stringType: { eq: 'bulk-updated' } } })
      expect(updated).toHaveLength(2)
    })

    it('should return 0 when no entities match', async () => {
      const result = await queryService.updateMany({ stringType: 'test' }, { numberType: { eq: 9999 } })
      expect(result.updatedCount).toBe(0)
    })
  })

  describe('#deleteOne', () => {
    it('should delete an existing entity and remove from database', async () => {
      const deleted = await queryService.deleteOne('test-entity-1')
      expect(deleted.id).toBe('test-entity-1')

      const found = await queryService.findById('test-entity-1')
      expect(found).toBeUndefined()
    })

    it('should throw when entity not found', async () => {
      await expect(queryService.deleteOne('non-existent')).rejects.toThrow()
    })

    it('should throw for useSoftDelete option', async () => {
      await expect(queryService.deleteOne('test-entity-3', { useSoftDelete: true })).rejects.toThrow(
        'MikroOrmQueryService does not support useSoftDelete on deleteOne'
      )
    })
  })

  describe('#deleteMany', () => {
    it('should delete multiple entities matching filter', async () => {
      const result = await queryService.deleteMany({ numberType: { lt: 3 } })
      expect(result.deletedCount).toBe(2)

      const remaining = await queryService.query({ filter: { numberType: { lt: 3 } } })
      expect(remaining).toHaveLength(0)
    })

    it('should return 0 when no entities match', async () => {
      const result = await queryService.deleteMany({ numberType: { eq: 9999 } })
      expect(result.deletedCount).toBe(0)
    })

    it('should throw for useSoftDelete option', async () => {
      await expect(queryService.deleteMany({}, { useSoftDelete: true })).rejects.toThrow(
        'MikroOrmQueryService does not support useSoftDelete on deleteMany'
      )
    })
  })

  describe('#aggregate', () => {
    it('should count entities', async () => {
      const result = await queryService.aggregate({}, { count: [{ field: 'id', args: {} }] })
      expect(result).toHaveLength(1)
      expect(result[0].count?.id).toBe(TEST_ENTITIES.length)
    })

    it('should sum numeric field', async () => {
      const result = await queryService.aggregate({}, { sum: [{ field: 'numberType', args: {} }] })
      expect(result).toHaveLength(1)
      const expectedSum = TEST_ENTITIES.reduce((sum, e) => sum + e.numberType, 0)
      expect(result[0].sum?.numberType).toBe(expectedSum)
    })

    it('should calculate average of numeric field', async () => {
      const result = await queryService.aggregate({}, { avg: [{ field: 'numberType', args: {} }] })
      expect(result).toHaveLength(1)
      const expectedAvg = TEST_ENTITIES.reduce((sum, e) => sum + e.numberType, 0) / TEST_ENTITIES.length
      expect(result[0].avg?.numberType).toBe(expectedAvg)
    })

    it('should find max of numeric field', async () => {
      const result = await queryService.aggregate({}, { max: [{ field: 'numberType', args: {} }] })
      expect(result).toHaveLength(1)
      expect(result[0].max?.numberType).toBe(10)
    })

    it('should find min of numeric field', async () => {
      const result = await queryService.aggregate({}, { min: [{ field: 'numberType', args: {} }] })
      expect(result).toHaveLength(1)
      expect(result[0].min?.numberType).toBe(1)
    })

    it('should apply filter to aggregate', async () => {
      const result = await queryService.aggregate({ numberType: { gt: 5 } }, { count: [{ field: 'id', args: {} }] })
      expect(result).toHaveLength(1)
      expect(result[0].count?.id).toBe(5)
    })

    it('should group by field', async () => {
      const result = await queryService.aggregate(
        {},
        {
          count: [{ field: 'id', args: {} }],
          groupBy: [{ field: 'boolType', args: {} }]
        }
      )
      expect(result).toHaveLength(2)
      const trueGroup = result.find((r) => Boolean(r.groupBy?.boolType) === true)
      const falseGroup = result.find((r) => Boolean(r.groupBy?.boolType) === false)
      expect(trueGroup?.count?.id).toBe(5)
      expect(falseGroup?.count?.id).toBe(5)
    })

    it('should return empty array when no aggregations specified', async () => {
      const result = await queryService.aggregate({}, {})
      expect(result).toEqual([])
    })

    it('should throw for withDeleted option', async () => {
      await expect(
        queryService.aggregate({}, { count: [{ field: 'id', args: {} }] }, { withDeleted: true })
      ).rejects.toThrow('MikroOrmQueryService does not support withDeleted on aggregate')
    })
  })
})
