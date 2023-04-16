import { Query, Resolver } from '@nestjs/graphql'

import { AggregateRelationsResolver } from '../../../../src/resolvers/relations'
import { AggregateRelationsResolverOpts } from '../../../../src/resolvers/relations/aggregate-relations.resolver'
import { generateSchema, TestRelationDTO, TestResolverDTO } from '../../../__fixtures__'

describe('AggregateRelationsResolver - 2', () => {
  const expectResolverSDL = async (opts?: AggregateRelationsResolverOpts) => {
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends AggregateRelationsResolver(TestResolverDTO, opts ?? {}) {
      @Query(() => TestResolverDTO)
      test(): TestResolverDTO {
        return { id: '1', stringField: 'foo' }
      }
    }

    const schema = await generateSchema([TestSDLResolver])
    expect(schema).toMatchSnapshot()
  }

  describe('aggregate', () => {
    it('should use the dtoName if provided', () =>
      expectResolverSDL({ enableAggregate: true, many: { relations: { DTO: TestRelationDTO, dtoName: 'Test' } } }))
  })
})
