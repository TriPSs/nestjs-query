import { Query, Resolver } from '@nestjs/graphql'
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'
import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito'

import { RelationsOpts, UpdateRelationsResolver } from '../../../src/resolvers/relations'
import {
  createResolverFromNest,
  generateSchema,
  TestPivotDTO,
  TestPivotService,
  TestRelationDTO,
  TestResolverDTO,
  TestService
} from '../../__fixtures__'

describe('UpdateRelationsResolver - pivot', () => {
  const pivot = { DTO: () => TestPivotDTO, enableUpdate: true }

  const expectResolverSDL = async (opts: RelationsOpts) => {
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends UpdateRelationsResolver(TestResolverDTO, opts) {
      @Query(() => TestResolverDTO)
      test(): TestResolverDTO {
        return { id: '1', stringField: 'foo' }
      }
    }

    const schema = await generateSchema([TestSDLResolver])
    expect(schema).toMatchSnapshot()
  }

  it('should accept the pivot properties on add/set and add a mutation to update them', () =>
    expectResolverSDL({ many: { relations: { DTO: TestRelationDTO, update: { enabled: true }, pivot } } }))

  it('should use the configured field name', () =>
    expectResolverSDL({
      many: { relations: { DTO: TestRelationDTO, update: { enabled: true }, pivot: { ...pivot, fieldName: 'edgeProperties' } } }
    }))

  it('should not add pivot mutations when enableUpdate is not set', () =>
    expectResolverSDL({
      many: { relations: { DTO: TestRelationDTO, update: { enabled: true }, pivot: { ...pivot, enableUpdate: false } } }
    }))

  it('should fail when the pivot does not map the pair', () => {
    expect(() =>
      UpdateRelationsResolver(TestResolverDTO, {
        many: { relations: { DTO: TestRelationDTO, update: { enabled: true }, pivot: () => TestResolverDTO } }
      })
    ).toThrow(
      "Unable to resolve the pivot 'TestResolverDTO' on the 'relations' relation of TestResolverDTO. " +
        'TestResolverDTO declares no @PivotMapping, which does not tie TestResolverDTO to TestRelationDTO. ' +
        'Add the pair to @PivotMapping on TestResolverDTO.'
    )
  })

  describe('writing the properties', () => {
    @Resolver(() => TestResolverDTO)
    class TestResolver extends UpdateRelationsResolver(TestResolverDTO, {
      many: { relations: { DTO: TestRelationDTO, update: { enabled: true }, pivot } }
    }) {
      constructor(service: TestService) {
        super(service)
      }
    }

    const output: TestResolverDTO = { id: 'record-id', stringField: 'foo' }

    const createTestResolver = async () => {
      const mockPivotService = mock(TestPivotService)
      const { resolver, mockService } = await createResolverFromNest(TestResolver, TestResolverDTO, [
        { provide: getQueryServiceToken(TestPivotDTO), useValue: instance(mockPivotService) }
      ])
      return { resolver, mockService, mockPivotService }
    }

    it('should write the properties of every relation added', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver()
      const input = { id: 'record-id', relationIds: ['rel-1', 'rel-2'], properties: { since: '2020' } }

      when(mockService.addRelations('relations', input.id, deepEqual(input.relationIds), undefined)).thenResolve(output)
      when(mockPivotService.updateMany(anything(), anything())).thenResolve({ updatedCount: 2 })

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const result = await resolver.addRelationsToTestResolverDTO({ input })

      expect(result).toEqual(output)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const [update, filter] = capture(mockPivotService.updateMany).last()
      expect(update).toEqual({ since: '2020' })
      expect(filter).toEqual({
        and: [{ testResolverId: { in: ['record-id'] } }, { testRelationId: { in: ['rel-1', 'rel-2'] } }]
      })
    })

    it('should not write the properties when the relation mutation is rejected', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver()
      const input = { id: 'record-id', relationIds: ['rel-1', 'forbidden'], properties: { since: '2020' } }

      // The service rejects the whole mutation when a relation is filtered out by the authorizer,
      // which is what keeps the pivot write from running for relations the caller cannot touch.
      when(mockService.addRelations('relations', input.id, deepEqual(input.relationIds), anything())).thenReject(
        new Error('Unable to find all relations to add to TestResolverDTO')
      )

      await expect(
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        resolver.addRelationsToTestResolverDTO({ input })
      ).rejects.toThrow('Unable to find all relations to add to TestResolverDTO')

      verify(mockPivotService.updateMany(anything(), anything())).never()
    })

    it('should not touch the pivot when no properties are provided', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver()
      const input = { id: 'record-id', relationIds: ['rel-1'] }

      when(mockService.addRelations('relations', input.id, deepEqual(input.relationIds), undefined)).thenResolve(output)

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await resolver.addRelationsToTestResolverDTO({ input })

      verify(mockPivotService.updateMany(anything(), anything())).never()
    })

    it('should write the properties of the relations that were set', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver()
      const input = { id: 'record-id', relationIds: ['rel-1'], properties: { since: '2021' } }

      when(mockService.setRelations('relations', input.id, deepEqual(input.relationIds), undefined)).thenResolve(output)
      when(mockPivotService.updateMany(anything(), anything())).thenResolve({ updatedCount: 1 })

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const result = await resolver.setRelationsOnTestResolverDTO({ input })

      expect(result).toEqual(output)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const [update, filter] = capture(mockPivotService.updateMany).last()
      expect(update).toEqual({ since: '2021' })
      expect(filter).toEqual({
        and: [{ testResolverId: { in: ['record-id'] } }, { testRelationId: { in: ['rel-1'] } }]
      })
    })

    it('should update the properties of an existing relationship', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver()
      const input = { id: 'record-id', relationId: 'rel-1', properties: { since: '2022' } }

      when(mockService.getById(input.id, deepEqual({ filter: undefined }))).thenResolve(output)
      when(
        mockService.queryRelations(
          TestRelationDTO,
          'relations',
          output,
          deepEqual({ filter: { id: { eq: 'rel-1' } }, paging: { limit: 1 } })
        )
      ).thenResolve([{ id: 'rel-1', testResolverId: 'record-id' }])
      when(mockPivotService.updateMany(anything(), anything())).thenResolve({ updatedCount: 1 })

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const result = await resolver.setRelationsPropertiesOnTestResolverDTO({ input })

      expect(result).toEqual(output)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const [update, filter] = capture(mockPivotService.updateMany).last()
      expect(update).toEqual({ since: '2022' })
      expect(filter).toEqual({
        and: [{ testResolverId: { in: ['record-id'] } }, { testRelationId: { in: ['rel-1'] } }]
      })
    })

    it('should not write the properties of a relationship that does not exist', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver()
      const input = { id: 'record-id', relationId: 'rel-404', properties: { since: '2022' } }

      when(mockService.getById(input.id, deepEqual({ filter: undefined }))).thenResolve(output)
      when(mockService.queryRelations(TestRelationDTO, 'relations', output, anything())).thenResolve([])

      await expect(
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        resolver.setRelationsPropertiesOnTestResolverDTO({ input })
      ).rejects.toThrow('Unable to find Relations rel-404 on TestResolverDTO record-id')

      verify(mockPivotService.updateMany(anything(), anything())).never()
    })
  })
})
