import { Resolver } from '@nestjs/graphql'
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'
import { CursorQueryArgsType, PagingStrategies } from '@ptc-org/nestjs-query-graphql'
import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito'

import { ReadRelationsResolver } from '../../../../src/resolvers/relations'
import {
  createResolverFromNest,
  TestPivotDTO,
  TestPivotService,
  TestRelationDTO,
  TestResolverDTO,
  TestService
} from '../../../__fixtures__'

type PivotEdge = { node: TestRelationDTO; properties?: Promise<unknown> }
type PivotConnection = { edges: PivotEdge[] }

/**
 * The relation resolvers are generated, so the method is only known at runtime.
 */
const queryRelations = (
  resolver: unknown,
  dto: TestResolverDTO,
  query: CursorQueryArgsType<TestRelationDTO>,
  context: object
): Promise<PivotConnection> =>
  (resolver as Record<string, (...args: unknown[]) => Promise<PivotConnection>>).queryRelations(dto, query, context)

describe('ReadRelationsResolver - pivot - behaviour', () => {
  const dto: TestResolverDTO = { id: 'dto-1', stringField: 'foo' }
  const nodes: TestRelationDTO[] = [
    { id: 'rel-1', testResolverId: dto.id },
    { id: 'rel-2', testResolverId: dto.id }
  ]
  const query: CursorQueryArgsType<TestRelationDTO> = { paging: { first: 10 } }

  const pivotRow = (nodeId: string, since: string) => ({
    testResolverId: dto.id,
    testRelationId: nodeId,
    since
  })

  const createTestResolver = async (opts: { enableFilter?: boolean } = {}) => {
    @Resolver(() => TestResolverDTO)
    class TestResolver extends ReadRelationsResolver(TestResolverDTO, {
      many: { relations: { DTO: TestRelationDTO, pivot: { DTO: () => TestPivotDTO, ...opts } } }
    }) {
      constructor(service: TestService) {
        super(service)
      }
    }

    const mockPivotService = mock(TestPivotService)
    const { resolver, mockService } = await createResolverFromNest(TestResolver, TestResolverDTO, [
      { provide: getQueryServiceToken(TestPivotDTO), useValue: instance(mockPivotService) }
    ])

    when(mockService.queryRelations(TestRelationDTO, 'relations', deepEqual([dto]), anything(), anything())).thenResolve(
      new Map([[dto, nodes]])
    )

    return { resolver, mockService, mockPivotService }
  }

  it('should throw when the paging strategy does not create edges', () => {
    expect(() =>
      ReadRelationsResolver(TestResolverDTO, {
        many: {
          relations: { DTO: TestRelationDTO, pivot: () => TestPivotDTO, pagingStrategy: PagingStrategies.OFFSET }
        }
      })
    ).toThrow(
      "Unable to expose pivot properties on the 'relations' relation of TestResolverDTO. " +
        'Pivot properties are exposed on edges, which are only created by the cursor paging strategy.'
    )
  })

  it('should fail when the mapping does not cover the pair', () => {
    expect(() =>
      ReadRelationsResolver(TestRelationDTO, {
        many: { relations: { DTO: TestRelationDTO, pivot: () => TestPivotDTO } }
      })
    ).toThrow(
      "Unable to resolve the pivot 'TestPivotDTO' on the 'relations' relation of TestRelationDTO. " +
        'TestPivotDTO maps TestResolverDTO <-> TestRelationDTO, which does not tie TestRelationDTO to TestRelationDTO. ' +
        'Add the pair to @PivotMapping on TestPivotDTO.'
    )
  })

  it('should fail when the pivot declares no mapping', () => {
    expect(() =>
      ReadRelationsResolver(TestResolverDTO, {
        many: { relations: { DTO: TestRelationDTO, pivot: () => TestResolverDTO } }
      })
    ).toThrow(
      "Unable to resolve the pivot 'TestResolverDTO' on the 'relations' relation of TestResolverDTO. " +
        'TestResolverDTO declares no @PivotMapping, which does not tie TestResolverDTO to TestRelationDTO. ' +
        'Add the pair to @PivotMapping on TestResolverDTO.'
    )
  })

  describe('resolving the properties', () => {
    it('should query the pivot by both ends of the relationship', async () => {
      const { resolver, mockPivotService } = await createTestResolver()
      const pivots = [pivotRow('rel-1', '2020'), pivotRow('rel-2', '2021')]

      when(mockPivotService.query(anything())).thenResolve(pivots)

      const connection = await queryRelations(resolver, dto, query, {})

      await expect(Promise.all(connection.edges.map((edge) => edge.properties))).resolves.toEqual(pivots)

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const [pivotQuery] = capture(mockPivotService.query).last()
      expect(pivotQuery).toEqual({
        filter: {
          and: [{ testResolverId: { in: ['dto-1'] } }, { testRelationId: { in: ['rel-1', 'rel-2'] } }]
        }
      })
    })

    it('should resolve to undefined when the relationship has no pivot record', async () => {
      const { resolver, mockPivotService } = await createTestResolver()

      when(mockPivotService.query(anything())).thenResolve([pivotRow('rel-1', '2020')])

      const connection = await queryRelations(resolver, dto, query, {})

      await expect(Promise.all(connection.edges.map((edge) => edge.properties))).resolves.toEqual([
        pivotRow('rel-1', '2020'),
        undefined
      ])
    })

    it('should batch every parent of the request into a single query', async () => {
      const otherDto: TestResolverDTO = { id: 'dto-2', stringField: 'bar' }
      const otherNodes: TestRelationDTO[] = [{ id: 'rel-3', testResolverId: otherDto.id }]
      const otherPivot = { testResolverId: otherDto.id, testRelationId: 'rel-3', since: '2022' }
      const { resolver, mockService, mockPivotService } = await createTestResolver()

      when(
        mockService.queryRelations(TestRelationDTO, 'relations', deepEqual([dto, otherDto]), anything(), anything())
      ).thenResolve(
        new Map([
          [dto, nodes],
          [otherDto, otherNodes]
        ])
      )
      when(mockPivotService.query(anything())).thenResolve([pivotRow('rel-1', '2020'), otherPivot])

      const context = {}
      const [connection, otherConnection] = await Promise.all([
        queryRelations(resolver, dto, query, context),
        queryRelations(resolver, otherDto, query, context)
      ])

      const properties = await Promise.all([...connection.edges, ...otherConnection.edges].map((edge) => edge.properties))

      expect(properties).toEqual([pivotRow('rel-1', '2020'), undefined, otherPivot])
      verify(mockPivotService.query(anything())).once()
    })
  })

  describe('filtering by the properties', () => {
    it('should narrow the relation to the nodes matching the filter', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver({ enableFilter: true })
      const matching = [{ id: 'rel-2', testResolverId: dto.id }]

      when(mockPivotService.query(anything())).thenResolve([pivotRow('rel-2', '2021')])
      when(mockService.queryRelations(TestRelationDTO, 'relations', deepEqual([dto]), anything(), anything())).thenResolve(
        new Map([[dto, matching]])
      )

      const connection = await queryRelations(
        resolver,
        dto,
        { paging: { first: 10 }, filter: { properties: { since: { eq: '2021' } } } } as CursorQueryArgsType<TestRelationDTO>,
        {}
      )

      expect(connection.edges.map((edge) => edge.node)).toEqual(matching)

      // the pivot is queried by the parent plus the user's filter...
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const [pivotQuery] = capture(mockPivotService.query).last()
      expect(pivotQuery).toEqual({
        filter: { and: [{ since: { eq: '2021' } }, { testResolverId: { in: ['dto-1'] } }] }
      })

      // ...and the relation with the ids it resolved to, with `properties` stripped out.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const [, , , relationQuery] = capture(mockService.queryRelations).last()
      expect(relationQuery.filter).toEqual({ id: { in: ['rel-2'] } })
    })

    it('should return an empty connection without querying the relation when nothing matches', async () => {
      const { resolver, mockService, mockPivotService } = await createTestResolver({ enableFilter: true })

      when(mockPivotService.query(anything())).thenResolve([])

      const connection = await queryRelations(
        resolver,
        dto,
        { paging: { first: 10 }, filter: { properties: { since: { eq: 'nope' } } } } as CursorQueryArgsType<TestRelationDTO>,
        {}
      )

      expect(connection.edges).toEqual([])
      verify(mockService.queryRelations(TestRelationDTO, 'relations', anything(), anything(), anything())).never()
    })
  })
})
