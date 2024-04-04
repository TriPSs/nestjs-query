import { Query, Resolver } from '@nestjs/graphql'

import { ReadRelationsResolver, RelationsOpts } from '../../../../../src/resolvers/relations'
import { generateSchema, TestRelationDTO, TestResolverDTO } from '../../../../__fixtures__'

describe('ReadRelationsResolver - many - 1', () => {
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

  it('should not add read methods if disableRead is true', () =>
    expectResolverSDL({ many: { relations: { DTO: TestRelationDTO, disableRead: true } } }))

  it('should not add filter argument if disableFilter is true', () =>
    expectResolverSDL({ many: { relation: { DTO: TestRelationDTO, disableFilter: true } } }))
})
