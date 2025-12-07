import { MikroORM } from '@mikro-orm/core'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { Test, TestingModule } from '@nestjs/testing'
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'

import { MikroOrmQueryService, NestjsQueryMikroOrmModule } from '../src'
import { CONNECTION_OPTIONS, TestEntity, TestRelation } from './__fixtures__'

describe('NestjsQueryMikroOrmModule', () => {
  let moduleRef: TestingModule
  let orm: MikroORM<SqliteDriver>

  afterEach(async () => {
    if (orm) {
      await orm.close()
    }
    if (moduleRef) {
      await moduleRef.close()
    }
  })

  describe('forFeature', () => {
    it('should create query services for entities', async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          MikroOrmModule.forRoot(CONNECTION_OPTIONS),
          NestjsQueryMikroOrmModule.forFeature([TestEntity, TestRelation]),
        ],
      }).compile()

      orm = moduleRef.get(MikroORM)
      await orm.getSchemaGenerator().createSchema()

      const testEntityService = moduleRef.get<MikroOrmQueryService<TestEntity>>(getQueryServiceToken(TestEntity))
      const testRelationService = moduleRef.get<MikroOrmQueryService<TestRelation>>(getQueryServiceToken(TestRelation))

      expect(testEntityService).toBeInstanceOf(MikroOrmQueryService)
      expect(testRelationService).toBeInstanceOf(MikroOrmQueryService)
    })

    it('should create query service with custom DTO', async () => {
      class TestEntityDTO {
        id!: string
        stringType!: string
      }

      moduleRef = await Test.createTestingModule({
        imports: [
          MikroOrmModule.forRoot(CONNECTION_OPTIONS),
          NestjsQueryMikroOrmModule.forFeature([{ entity: TestEntity, dto: TestEntityDTO }]),
        ],
      }).compile()

      orm = moduleRef.get(MikroORM)
      await orm.getSchemaGenerator().createSchema()

      const service = moduleRef.get<MikroOrmQueryService<TestEntityDTO, TestEntity>>(getQueryServiceToken(TestEntityDTO))
      expect(service).toBeInstanceOf(MikroOrmQueryService)
    })

    it('should export MikroOrmModule', async () => {
      moduleRef = await Test.createTestingModule({
        imports: [MikroOrmModule.forRoot(CONNECTION_OPTIONS), NestjsQueryMikroOrmModule.forFeature([TestEntity])],
      }).compile()

      orm = moduleRef.get(MikroORM)
      expect(orm).toBeDefined()
    })
  })
})
