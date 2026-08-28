import { Query, Resolver } from '@nestjs/graphql'

import { ReadRelationsResolver, RelationsOpts } from '../../../../../src/resolvers/relations'
import { generateSchema, TestPivotDTO, TestRelationDTO, TestResolverDTO } from '../../../../__fixtures__'

const pivot = { DTO: () => TestPivotDTO }

const expectResolverSDL = async (opts: RelationsOpts) => {
  @Resolver(() => TestResolverDTO)
  class TestSDLResolver extends ReadRelationsResolver(TestResolverDTO, opts) {
    @Query(() => TestResolverDTO)
    test(): TestResolverDTO {
      return { id: '1', stringField: 'foo' }
    }
  }

  const schema = await generateSchema([TestSDLResolver])
  expect(schema).toMatchSnapshot()
}

describe('ReadRelationsResolver - pivot - 1', () => {
  it('should add a properties field to the edges of the relation', () =>
    expectResolverSDL({ many: { relations: { DTO: TestRelationDTO, pivot } } }))
})
