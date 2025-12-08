import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'

import { createMikroOrmQueryServiceProviders } from '../src/providers'
import { TestEntity } from './__fixtures__/test.entity'
import { TestRelation } from './__fixtures__/test-relation.entity'

describe('createMikroOrmQueryServiceProviders', () => {
  it('should create a provider for a single entity', () => {
    const providers = createMikroOrmQueryServiceProviders([TestEntity])
    expect(providers).toHaveLength(1)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
    expect(providers[0].useFactory).toBeDefined()
    expect(providers[0].inject).toHaveLength(1)
  })

  it('should create providers for multiple entities', () => {
    const providers = createMikroOrmQueryServiceProviders([TestEntity, TestRelation])
    expect(providers).toHaveLength(2)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
    expect(providers[1].provide).toBe(getQueryServiceToken(TestRelation))
  })

  it('should support contextName parameter', () => {
    const providers = createMikroOrmQueryServiceProviders([TestEntity], 'customConnection')
    expect(providers).toHaveLength(1)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
  })
})
