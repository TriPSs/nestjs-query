import { Query, Resolver } from '@nestjs/graphql'

import { ReadRelationsResolver, RelationsOpts } from '../../../../../src/resolvers/relations'
import { generateSchema, TestRelationDTO, TestResolverDTO } from '../../../../__fixtures__'

describe('ReadRelationsResolver - many - 5', () => {
  const expectResolverSDL = async (opts?: RelationsOpts) => {
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends ReadRelationsResolver(TestResolverDTO, opts ?? {}) {
      @Query(() => TestResolverDTO)
      test(): TestResolverDTO {
        return { id: '1', stringField: 'foo' }
      }
    }

    const schema = await generateSchema([TestSDLResolver])
    expect(schema).toMatchSnapshot()
  }

  it('should set the field to nullable if set to true', () =>
    expectResolverSDL({ many: { relations: { DTO: TestRelationDTO, nullable: true } } }))
})
