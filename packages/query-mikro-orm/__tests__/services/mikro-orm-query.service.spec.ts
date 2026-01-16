import { BetterSqliteDriver } from '@mikro-orm/better-sqlite'
import { EntityRepository, MikroORM } from '@mikro-orm/core'
import { SortDirection, SortNulls } from '@souagrosolucoes/nestjs-query-core'

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
})
