import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'
import { ModelCtor, Sequelize } from 'sequelize-typescript'

import { SequelizeQueryService } from '../../src'
import {
  DELETED_PARANOID_TEST_ENTITY_PK,
  PARANOID_CONNECTION_OPTIONS,
  PARANOID_TEST_ENTITY_PK,
  RELATION_OF_DELETED_PARANOID_TEST_ENTITY_PK,
  seedParanoid
} from '../__fixtures__/paranoid.fixture'
import { ParanoidTestEntity } from '../__fixtures__/paranoid-test.entity'
import { ParanoidTestEntityRelation } from '../__fixtures__/paranoid-test-entity-relation.entity'
import { ParanoidTestRelation } from '../__fixtures__/paranoid-test-relation.entity'

describe('SequelizeQueryService withDeleted', (): void => {
  let moduleRef: TestingModule

  class ParanoidTestEntityService extends SequelizeQueryService<ParanoidTestEntity> {
    constructor(@InjectModel(ParanoidTestEntity) readonly model: ModelCtor<ParanoidTestEntity>) {
      super(model)
    }
  }

  class ParanoidTestRelationService extends SequelizeQueryService<ParanoidTestRelation> {
    constructor(@InjectModel(ParanoidTestRelation) readonly model: ModelCtor<ParanoidTestRelation>) {
      super(model)
    }
  }

  afterEach(() => moduleRef.get(Sequelize).close())

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot(PARANOID_CONNECTION_OPTIONS),
        SequelizeModule.forFeature([ParanoidTestEntity, ParanoidTestEntityRelation, ParanoidTestRelation])
      ],
      providers: [ParanoidTestEntityService, ParanoidTestRelationService]
    }).compile()
    const sequelize = moduleRef.get(Sequelize)
    await sequelize.sync()
    await seedParanoid(sequelize)
  })

  const aliveEntity = async (): Promise<ParanoidTestEntity> => ParanoidTestEntity.findByPk(PARANOID_TEST_ENTITY_PK)

  describe('#query', () => {
    it('should exclude soft deleted records by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const queryResult = await queryService.query({})
      expect(queryResult.map((e) => e.stringType)).toEqual(['a'])
    })

    it('should include soft deleted records when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const queryResult = await queryService.query({}, { withDeleted: true })
      expect(queryResult.map((e) => e.stringType)).toEqual(['a', 'b'])
    })
  })

  describe('#exportMany', () => {
    it('should exclude soft deleted records by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const exported = await queryService.exportMany({})
      expect(exported.map((e) => e.stringType)).toEqual(['a'])
    })

    it('should include soft deleted records when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const exported = await queryService.exportMany({}, { withDeleted: true })
      expect(exported.map((e) => e.stringType)).toEqual(['a', 'b'])
    })
  })

  describe('#count', () => {
    it('should exclude soft deleted records by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      await expect(queryService.count({})).resolves.toBe(1)
    })

    it('should include soft deleted records when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      await expect(queryService.count({}, { withDeleted: true })).resolves.toBe(2)
    })
  })

  describe('#aggregate', () => {
    it('should include soft deleted records when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const aggregate = { count: [{ field: 'paranoidTestEntityPk' as const, args: {} }] }

      await expect(queryService.aggregate({}, aggregate)).resolves.toEqual([{ count: { paranoidTestEntityPk: 1 } }])
      await expect(queryService.aggregate({}, aggregate, { withDeleted: true })).resolves.toEqual([
        { count: { paranoidTestEntityPk: 2 } }
      ])
    })
  })

  describe('#findById', () => {
    it('should not find a soft deleted record by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      await expect(queryService.findById(DELETED_PARANOID_TEST_ENTITY_PK)).resolves.toBeUndefined()
    })

    it('should find a soft deleted record when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const found = await queryService.findById(DELETED_PARANOID_TEST_ENTITY_PK, { withDeleted: true })
      expect(found?.stringType).toBe('b')
    })
  })

  describe('#queryRelations', () => {
    it('should exclude soft deleted relations by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const relations = await queryService.queryRelations(ParanoidTestRelation, 'paranoidTestRelations', await aliveEntity(), {})
      expect(relations.map((r) => r.relationName)).toEqual(['a'])
    })

    it('should include soft deleted relations when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const relations = await queryService.queryRelations(
        ParanoidTestRelation,
        'paranoidTestRelations',
        await aliveEntity(),
        {},
        { withDeleted: true }
      )
      expect(relations.map((r) => r.relationName)).toEqual(['a', 'b'])
    })

    it('should include soft deleted relations for a batch of entities when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const entity = await aliveEntity()
      const relationMap = await queryService.queryRelations(
        ParanoidTestRelation,
        'paranoidTestRelations',
        [entity],
        {},
        { withDeleted: true }
      )
      expect(relationMap.get(entity).map((r) => r.relationName)).toEqual(['a', 'b'])
    })

    it('should exclude soft deleted many to many relations by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const relations = await queryService.queryRelations(
        ParanoidTestRelation,
        'manyParanoidTestRelations',
        await aliveEntity(),
        {}
      )
      expect(relations.map((r) => r.relationName)).toEqual(['a'])
    })

    it('should include soft deleted many to many relations when withDeleted is set, but not ones whose join row was soft deleted', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const relations = await queryService.queryRelations(
        ParanoidTestRelation,
        'manyParanoidTestRelations',
        await aliveEntity(),
        {},
        { withDeleted: true }
      )
      expect(relations.map((r) => r.relationName)).toEqual(['a', 'b'])
    })
  })

  describe('#countRelations', () => {
    it('should exclude soft deleted relations by default', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      await expect(
        queryService.countRelations(ParanoidTestRelation, 'paranoidTestRelations', await aliveEntity(), {})
      ).resolves.toBe(1)
    })

    it('should include soft deleted relations when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      await expect(
        queryService.countRelations(ParanoidTestRelation, 'paranoidTestRelations', await aliveEntity(), {}, { withDeleted: true })
      ).resolves.toBe(2)
    })

    it('should include soft deleted relations for a batch of entities when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestEntityService)
      const entity = await aliveEntity()
      const countMap = await queryService.countRelations(
        ParanoidTestRelation,
        'paranoidTestRelations',
        [entity],
        {},
        { withDeleted: true }
      )
      expect(countMap.get(entity)).toBe(2)
    })
  })

  describe('#findRelation', () => {
    const relationOfDeletedEntity = async (): Promise<ParanoidTestRelation> =>
      ParanoidTestRelation.findByPk(RELATION_OF_DELETED_PARANOID_TEST_ENTITY_PK)

    it('should not find a soft deleted relation by default', async () => {
      const queryService = moduleRef.get(ParanoidTestRelationService)
      await expect(
        queryService.findRelation(ParanoidTestEntity, 'paranoidTestEntity', await relationOfDeletedEntity())
      ).resolves.toBeUndefined()
    })

    it('should find a soft deleted relation when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestRelationService)
      const relation = await queryService.findRelation(
        ParanoidTestEntity,
        'paranoidTestEntity',
        await relationOfDeletedEntity(),
        { withDeleted: true }
      )
      expect(relation?.stringType).toBe('b')
    })

    it('should find soft deleted relations for a batch of entities when withDeleted is set', async () => {
      const queryService = moduleRef.get(ParanoidTestRelationService)
      const relation = await relationOfDeletedEntity()
      const relationMap = await queryService.findRelation(ParanoidTestEntity, 'paranoidTestEntity', [relation], {
        withDeleted: true
      })
      expect(relationMap.get(relation)?.stringType).toBe('b')
    })
  })
})
