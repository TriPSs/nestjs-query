import { EntityRepository } from '@mikro-orm/core'
import { getRepositoryToken } from '@mikro-orm/nestjs'
import { getQueryServiceToken } from '@souagrosolucoes/nestjs-query-core'

import { createMikroOrmQueryServiceProviders, MikroOrmQueryService } from '../src'
import { TestEntity, TestRelation } from './__fixtures__'

describe('createMikroOrmQueryServiceProviders', () => {
  it('should create providers for entity classes', () => {
    const providers = createMikroOrmQueryServiceProviders([TestEntity, TestRelation])

    expect(providers).toHaveLength(2)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
    expect(providers[1].provide).toBe(getQueryServiceToken(TestRelation))
  })

  it('should create provider with custom DTO', () => {
    class TestEntityDTO {
      id!: string
    }

    const providers = createMikroOrmQueryServiceProviders([{ entity: TestEntity, dto: TestEntityDTO }])

    expect(providers).toHaveLength(1)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntityDTO))
  })

  it('should inject repository token', () => {
    const providers = createMikroOrmQueryServiceProviders([TestEntity])

    expect(providers[0].inject).toContain(getRepositoryToken(TestEntity))
  })

  it('should inject repository token with data source', () => {
    const dataSource = 'custom-data-source'
    const providers = createMikroOrmQueryServiceProviders([TestEntity], dataSource)

    expect(providers[0].inject).toContain(getRepositoryToken(TestEntity, dataSource))
  })

  it('should create MikroOrmQueryService instance via factory', () => {
    const providers = createMikroOrmQueryServiceProviders([TestEntity])
    const mockRepo = {} as EntityRepository<TestEntity>

    const service = providers[0].useFactory(mockRepo)

    expect(service).toBeInstanceOf(MikroOrmQueryService)
  })
})
