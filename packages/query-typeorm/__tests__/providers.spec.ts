import { getRepositoryToken } from '@nestjs/typeorm'
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'
import { DataSource } from 'typeorm'

import { createTypeOrmQueryServiceProviders } from '../src/providers'
import { TypeOrmQueryService } from '../src/services'
import { createTestConnection } from './__fixtures__/connection.fixture'
import { TestEntity } from './__fixtures__/test.entity'

describe('createTypeOrmQueryServiceProviders', () => {
  let dataSource: DataSource
  beforeEach(async () => {
    dataSource = await createTestConnection()
  })
  afterEach(() => dataSource.destroy())

  it('should create a provider for the entity', () => {
    const testEntityRepository = dataSource.getRepository(TestEntity)
    const providers = createTypeOrmQueryServiceProviders([TestEntity])
    expect(providers).toHaveLength(1)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
    expect(providers[0].inject).toEqual([getRepositoryToken(TestEntity)])
    expect(providers[0].useFactory(testEntityRepository)).toBeInstanceOf(TypeOrmQueryService)
  })
})
