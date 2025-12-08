import { MikroORM, EntityRepository } from '@mikro-orm/core'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { SortDirection } from '@ptc-org/nestjs-query-core'

import { MikroOrmQueryService } from '../../src'
import { createTestConnection, refresh, truncate } from '../__fixtures__/connection.fixture'
import { TEST_ENTITIES, TEST_RELATIONS, TEST_SOFT_DELETE_ENTITIES } from '../__fixtures__/seeds'
import { TestEntity } from '../__fixtures__/test.entity'
import { TestRelation } from '../__fixtures__/test-relation.entity'
import { TestSoftDeleteEntity } from '../__fixtures__/test-soft-delete.entity'

describe('MikroOrmQueryService', () => {
  let orm: MikroORM<SqliteDriver>
  let testEntityService: MikroOrmQueryService<TestEntity>
  let testRelationService: MikroOrmQueryService<TestRelation>
  let testSoftDeleteService: MikroOrmQueryService<TestSoftDeleteEntity>

  beforeAll(async () => {
    orm = await createTestConnection()
  })

  afterAll(async () => {
    await orm.close(true)
  })

  beforeEach(async () => {
    await refresh(orm.em)
    orm.em.clear()

    const testEntityRepo = orm.em.getRepository(TestEntity) as EntityRepository<TestEntity>
    const testRelationRepo = orm.em.getRepository(TestRelation) as EntityRepository<TestRelation>
    const testSoftDeleteRepo = orm.em.getRepository(TestSoftDeleteEntity) as EntityRepository<TestSoftDeleteEntity>

    testEntityService = new MikroOrmQueryService(testEntityRepo)
    testRelationService = new MikroOrmQueryService(testRelationRepo)
    testSoftDeleteService = new MikroOrmQueryService(testSoftDeleteRepo, { useSoftDelete: true })
  })

  describe('#query', () => {
    it('should return all entities when no filter is provided', async () => {
      const result = await testEntityService.query({})
      expect(result).toHaveLength(TEST_ENTITIES.length)
    })

    it('should filter by eq', async () => {
      const result = await testEntityService.query({ filter: { stringType: { eq: 'foo1' } } })
      expect(result).toHaveLength(1)
      expect(result[0].stringType).toBe('foo1')
    })

    it('should filter by neq', async () => {
      const result = await testEntityService.query({ filter: { stringType: { neq: 'foo1' } } })
      expect(result).toHaveLength(TEST_ENTITIES.length - 1)
    })

    it('should filter by gt', async () => {
      const result = await testEntityService.query({ filter: { numberType: { gt: 5 } } })
      expect(result).toHaveLength(5)
    })

    it('should filter by gte', async () => {
      const result = await testEntityService.query({ filter: { numberType: { gte: 5 } } })
      expect(result).toHaveLength(6)
    })

    it('should filter by lt', async () => {
      const result = await testEntityService.query({ filter: { numberType: { lt: 5 } } })
      expect(result).toHaveLength(4)
    })

    it('should filter by lte', async () => {
      const result = await testEntityService.query({ filter: { numberType: { lte: 5 } } })
      expect(result).toHaveLength(5)
    })

    it('should filter by in', async () => {
      const result = await testEntityService.query({ filter: { stringType: { in: ['foo1', 'foo2'] } } })
      expect(result).toHaveLength(2)
    })

    it('should filter by notIn', async () => {
      const result = await testEntityService.query({ filter: { stringType: { notIn: ['foo1', 'foo2'] } } })
      expect(result).toHaveLength(TEST_ENTITIES.length - 2)
    })

    it('should filter by like', async () => {
      const result = await testEntityService.query({ filter: { stringType: { like: 'foo%' } } })
      expect(result).toHaveLength(TEST_ENTITIES.length)
    })

    it('should apply AND filter', async () => {
      const result = await testEntityService.query({
        filter: { and: [{ stringType: { eq: 'foo1' } }, { numberType: { eq: 1 } }] }
      })
      expect(result).toHaveLength(1)
    })

    it('should apply OR filter', async () => {
      const result = await testEntityService.query({
        filter: { or: [{ stringType: { eq: 'foo1' } }, { stringType: { eq: 'foo2' } }] }
      })
      expect(result).toHaveLength(2)
    })

    it('should apply sorting', async () => {
      const result = await testEntityService.query({
        sorting: [{ field: 'numberType', direction: SortDirection.DESC }]
      })
      expect(result[0].numberType).toBe(10)
      expect(result[9].numberType).toBe(1)
    })

    it('should apply paging', async () => {
      const result = await testEntityService.query({
        paging: { limit: 3, offset: 2 }
      })
      expect(result).toHaveLength(3)
    })
  })

  describe('#count', () => {
    it('should count all entities', async () => {
      const count = await testEntityService.count({})
      expect(count).toBe(TEST_ENTITIES.length)
    })

    it('should count with filter', async () => {
      const count = await testEntityService.count({ numberType: { gt: 5 } })
      expect(count).toBe(5)
    })
  })

  describe('#findById', () => {
    it('should find entity by id', async () => {
      const result = await testEntityService.findById('test-entity-1')
      expect(result).toBeDefined()
      expect(result?.testEntityPk).toBe('test-entity-1')
    })

    it('should return undefined for non-existent id', async () => {
      const result = await testEntityService.findById('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('#getById', () => {
    it('should get entity by id', async () => {
      const result = await testEntityService.getById('test-entity-1')
      expect(result.testEntityPk).toBe('test-entity-1')
    })

    it('should throw for non-existent id', async () => {
      await expect(testEntityService.getById('non-existent')).rejects.toThrow('Unable to find TestEntity with id: non-existent')
    })
  })

  describe('#createOne', () => {
    it('should create a new entity', async () => {
      const newEntity = await testEntityService.createOne({
        testEntityPk: 'new-entity',
        stringType: 'new',
        boolType: true,
        numberType: 100,
        dateType: new Date()
      })
      expect(newEntity.testEntityPk).toBe('new-entity')

      const found = await testEntityService.findById('new-entity')
      expect(found).toBeDefined()
    })
  })

  describe('#createMany', () => {
    it('should create multiple entities', async () => {
      const newEntities = await testEntityService.createMany([
        { testEntityPk: 'new-entity-1', stringType: 'new1', boolType: true, numberType: 101, dateType: new Date() },
        { testEntityPk: 'new-entity-2', stringType: 'new2', boolType: false, numberType: 102, dateType: new Date() }
      ])
      expect(newEntities).toHaveLength(2)

      const count = await testEntityService.count({})
      expect(count).toBe(TEST_ENTITIES.length + 2)
    })
  })

  describe('#updateOne', () => {
    it('should update an existing entity', async () => {
      const updated = await testEntityService.updateOne('test-entity-1', { stringType: 'updated' })
      expect(updated.stringType).toBe('updated')

      orm.em.clear()
      const found = await testEntityService.findById('test-entity-1')
      expect(found?.stringType).toBe('updated')
    })

    it('should throw for non-existent id', async () => {
      await expect(testEntityService.updateOne('non-existent', { stringType: 'updated' })).rejects.toThrow()
    })
  })

  describe('#updateMany', () => {
    it('should update multiple entities', async () => {
      const result = await testEntityService.updateMany({ stringType: 'bulk-updated' }, { numberType: { lte: 3 } })
      expect(result.updatedCount).toBe(3)

      orm.em.clear()
      const updated = await testEntityService.query({ filter: { stringType: { eq: 'bulk-updated' } } })
      expect(updated).toHaveLength(3)
    })
  })

  describe('#deleteOne', () => {
    it('should delete an entity', async () => {
      const deleted = await testEntityService.deleteOne('test-entity-1')
      expect(deleted.testEntityPk).toBe('test-entity-1')

      orm.em.clear()
      const found = await testEntityService.findById('test-entity-1')
      expect(found).toBeUndefined()
    })
  })

  describe('#deleteMany', () => {
    it('should delete multiple entities', async () => {
      const result = await testEntityService.deleteMany({ numberType: { lte: 3 } })
      expect(result.deletedCount).toBe(3)

      orm.em.clear()
      const count = await testEntityService.count({})
      expect(count).toBe(TEST_ENTITIES.length - 3)
    })
  })

  describe('#queryRelations', () => {
    it('should query relations for a single entity', async () => {
      const entity = await testEntityService.getById('test-entity-1')
      const relations = await testEntityService.queryRelations(TestRelation, 'testRelations', entity, {})
      expect(relations).toHaveLength(3)
    })

    it('should query relations for multiple entities', async () => {
      const entities = await testEntityService.query({ filter: { numberType: { lte: 2 } } })
      const relationsMap = await testEntityService.queryRelations(TestRelation, 'testRelations', entities, {})
      expect(relationsMap.size).toBe(2)
    })
  })

  describe('#countRelations', () => {
    it('should count relations for a single entity', async () => {
      const entity = await testEntityService.getById('test-entity-1')
      const count = await testEntityService.countRelations(TestRelation, 'testRelations', entity, {})
      expect(count).toBe(3)
    })

    it('should count relations for multiple entities', async () => {
      const entities = await testEntityService.query({ filter: { numberType: { lte: 2 } } })
      const countMap = await testEntityService.countRelations(TestRelation, 'testRelations', entities, {})
      expect(countMap.size).toBe(2)
    })
  })

  describe('#findRelation', () => {
    it('should find a single relation', async () => {
      const relationEntity = await testRelationService.getById('test-relations-test-entity-1-1')
      const entity = await testRelationService.findRelation(TestEntity, 'testEntity', relationEntity)
      expect(entity).toBeDefined()
      expect(entity?.testEntityPk).toBe('test-entity-1')
    })

    it('should return undefined if relation not found', async () => {
      const entity = await testEntityService.getById('test-entity-1')
      const relation = await testEntityService.findRelation(TestRelation, 'manyToOneRelation', entity)
      expect(relation).toBeUndefined()
    })
  })

  describe('soft delete', () => {
    it('should soft delete an entity', async () => {
      const deleted = await testSoftDeleteService.deleteOne('test-soft-delete-entity-1')
      expect(deleted.deletedAt).toBeDefined()

      orm.em.clear()
      const allEntities = await testSoftDeleteService.query({})
      expect(allEntities.find((e) => e.testEntityPk === 'test-soft-delete-entity-1')?.deletedAt).toBeDefined()
    })
  })
})
