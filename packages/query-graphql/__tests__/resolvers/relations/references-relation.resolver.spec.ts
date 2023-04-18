import { ID, ObjectType, Query, Resolver, TypeMetadataStorage } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'

import { ReferencesOpts, ReferencesRelationsResolver } from '../../../src/resolvers/relations'
import { createResolverFromNest, generateSchema, TestService } from '../../__fixtures__'

function createTestResolverDTO() {
  @ObjectType()
  class TestResolverDTO {
    @FilterableField(() => ID)
    id!: string

    @FilterableField()
    stringField!: string
  }
  return TestResolverDTO
}

function getTestRelationDTO() {
  @ObjectType()
  class TestRelationDTO {
    @FilterableField(() => ID)
    id!: string

    @FilterableField()
    testResolverId!: string
  }
  return TestRelationDTO
}

describe('ReferencesRelationMixin', () => {
  afterEach(() => {
    TypeMetadataStorage.clear()
  })
  const expectResolverSDL = async (opts?: ReferencesOpts<{ id: string; stringField: string }>) => {
    const TestResolverDTO = createTestResolverDTO()
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends ReferencesRelationsResolver(TestResolverDTO, opts ?? {}) {
      @Query(() => TestResolverDTO)
      test() {
        return { id: '1', stringField: 'foo' }
      }
    }

    const schema = await generateSchema([TestSDLResolver])
    expect(schema).toMatchSnapshot()
  }
  it('should not add reference methods if references empty', () => expectResolverSDL())

  it('should use the add the reference if provided', () =>
    expectResolverSDL({ reference: { DTO: getTestRelationDTO(), keys: { id: 'stringField' }, dtoName: 'Test' } }))

  it('should set the field to nullable if set to true', () =>
    expectResolverSDL({ reference: { DTO: getTestRelationDTO(), keys: { id: 'stringField' }, nullable: true } }))

  it('should return a references type from the passed in dto', async () => {
    const TestResolverDTO = createTestResolverDTO()
    @Resolver(() => TestResolverDTO)
    class TestResolver extends ReferencesRelationsResolver(TestResolverDTO, {
      reference: { DTO: getTestRelationDTO(), keys: { id: 'stringField' } }
    }) {
      constructor(service: TestService) {
        super(service)
      }
    }
    const { resolver } = await createResolverFromNest(TestResolver)
    const dto = {
      id: 'id-1',
      stringField: 'reference-id-1'
    }
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = await resolver.referenceReference(dto)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    return expect(result).toEqual({ __typename: 'Reference', id: dto.stringField })
  })
})
