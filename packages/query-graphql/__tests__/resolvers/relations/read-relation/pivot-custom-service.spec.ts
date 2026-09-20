import { Provider } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import { getQueryServiceToken, QueryService, RelationQueryService } from '@ptc-org/nestjs-query-core'
import { CursorQueryArgsType, pubSubToken } from '@ptc-org/nestjs-query-graphql'
import { PubSub } from 'graphql-subscriptions'
import { anything, capture, instance, mock, when } from 'ts-mockito'

import { getAuthorizerToken } from '../../../../src/auth'
import { ReadRelationsResolver } from '../../../../src/resolvers/relations'
import {
  TestPivotDTO,
  TestPivotService,
  TestRelationDTO,
  TestResolverAuthorizer,
  TestResolverDTO,
  TestService
} from '../../../__fixtures__'

type PivotEdge = { node: TestRelationDTO; properties?: Promise<unknown> }
type PivotConnection = { edges: PivotEdge[] }

const queryRelations = (
  resolver: unknown,
  dto: TestResolverDTO,
  query: CursorQueryArgsType<TestRelationDTO>,
  context: object
): Promise<PivotConnection> =>
  (resolver as Record<string, (...args: unknown[]) => Promise<PivotConnection>>).queryRelations(dto, query, context)

/**
 * A pivot resolves through its own service, so it is unaffected by how the relation itself is
 * loaded - including a `RelationQueryService` that swaps the service of that relation entirely.
 */
describe('ReadRelationsResolver - pivot - custom relation services', () => {
  const dto: TestResolverDTO = { id: 'dto-1', stringField: 'foo' }
  const nodes: TestRelationDTO[] = [
    { id: 'rel-1', testResolverId: dto.id },
    { id: 'rel-2', testResolverId: dto.id }
  ]
  const pivots = [
    { testResolverId: dto.id, testRelationId: 'rel-1', since: '2020' },
    { testResolverId: dto.id, testRelationId: 'rel-2', since: '2021' }
  ]

  @Resolver(() => TestResolverDTO)
  class TestResolver extends ReadRelationsResolver(TestResolverDTO, {
    many: { relations: { DTO: TestRelationDTO, pivot: () => TestPivotDTO } }
  }) {
    constructor(service: TestService) {
      super(service)
    }
  }

  /**
   * Built by hand: the shared helper always overrides the parent service with a mock, and the point
   * here is to hand it a real custom one.
   */
  const createResolver = async (parentService: unknown, pivotService: unknown): Promise<TestResolver> => {
    const providers: Provider[] = [
      TestResolver,
      { provide: TestService, useValue: parentService },
      { provide: getQueryServiceToken(TestPivotDTO), useValue: pivotService },
      { provide: getAuthorizerToken(TestResolverDTO), useValue: instance(mock(TestResolverAuthorizer)) },
      { provide: pubSubToken(), useValue: instance(mock(PubSub)) }
    ]
    const moduleRef = await Test.createTestingModule({ providers }).compile()

    return moduleRef.get(TestResolver)
  }

  it('should resolve the properties when the relation is loaded by a custom service', async () => {
    // The relation is served by a completely different service, correlated by a custom query.
    const mockRelationService = mock(TestPivotService)
    when(mockRelationService.query(anything())).thenResolve(nodes as never)

    const customService = new RelationQueryService<TestResolverDTO>({
      relations: {
        service: instance(mockRelationService) as unknown as QueryService<TestRelationDTO, unknown, unknown>,
        query: (parent: TestResolverDTO) => ({ filter: { testResolverId: { eq: parent.id } } })
      }
    })

    const mockPivotService = mock(TestPivotService)
    when(mockPivotService.query(anything())).thenResolve(pivots)

    const resolver = await createResolver(customService, instance(mockPivotService))

    const connection = await queryRelations(resolver, dto, { paging: { first: 10 } }, {})

    // the nodes came from the custom service...
    expect(connection.edges.map((edge) => edge.node)).toEqual(nodes)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const [relationQuery] = capture(mockRelationService.query).last()
    expect(relationQuery.filter).toEqual({ testResolverId: { eq: dto.id } })

    // ...and the properties still resolve, through the pivot's own service
    await expect(Promise.all(connection.edges.map((edge) => edge.properties))).resolves.toEqual(pivots)
  })

  it('should use a custom service registered for the pivot itself', async () => {
    const mockService = mock(TestService)
    when(mockService.queryRelations(TestRelationDTO, 'relations', anything(), anything(), anything())).thenResolve(
      new Map([[dto, nodes]]) as never
    )

    // Any provider registered under the pivot's token wins - a plain service, a decorated one, or a
    // RelationQueryService of its own.
    const customPivotService = {
      // eslint-disable-next-line @typescript-eslint/require-await
      query: async () => [{ testResolverId: dto.id, testRelationId: 'rel-1', since: 'from-custom-service' }]
    }

    const resolver = await createResolver(instance(mockService), customPivotService)

    const connection = await queryRelations(resolver, dto, { paging: { first: 10 } }, {})

    await expect(connection.edges[0].properties).resolves.toEqual({
      testResolverId: dto.id,
      testRelationId: 'rel-1',
      since: 'from-custom-service'
    })
  })
})
