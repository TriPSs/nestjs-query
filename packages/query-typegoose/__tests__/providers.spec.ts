import { getModelToken } from '@m8a/nestjs-typegoose'
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'

import { createTypegooseQueryServiceProviders } from '../src/providers'
import { TypegooseQueryService } from '../src/services'

describe('createTypegooseQueryServiceProviders', () => {
  it('should create a provider for the entity', () => {
    class TestEntity {}

    const providers = createTypegooseQueryServiceProviders([TestEntity])

    expect(providers).toHaveLength(1)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
    expect(providers[0].inject).toEqual([getModelToken(TestEntity.name)])
    expect(providers[0].useFactory(TestEntity)).toBeInstanceOf(TypegooseQueryService)
  })

  it('should create a provider for the entity and its discriminators', () => {
    class TestEntity {}
    class TestDiscriminator extends TestEntity {}

    const providers = createTypegooseQueryServiceProviders([{ typegooseClass: TestEntity, discriminators: [TestDiscriminator] }])

    expect(providers).toHaveLength(2)
    expect(providers[0].provide).toBe(getQueryServiceToken(TestEntity))
    expect(providers[0].inject).toEqual([getModelToken(TestEntity.name)])
    expect(providers[0].useFactory(TestEntity)).toBeInstanceOf(TypegooseQueryService)

    expect(providers[1].provide).toBe(getQueryServiceToken(TestDiscriminator))
    expect(providers[1].inject).toEqual([getModelToken(TestDiscriminator.name)])
    expect(providers[1].useFactory(TestDiscriminator)).toBeInstanceOf(TypegooseQueryService)
  })
})
