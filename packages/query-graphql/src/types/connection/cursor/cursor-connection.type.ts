import { NotImplementedException } from '@nestjs/common'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Class, MapReflector, Query } from '@ptc-org/nestjs-query-core'

import { getGraphqlObjectName } from '../../../common'
import { SkipIf } from '../../../decorators'
import { PagingStrategies } from '../../query'
import {
  Count,
  CountFn,
  CreateConnectionOptions,
  CursorConnectionOptions,
  CursorConnectionType,
  EdgeType,
  PageInfoType,
  QueryMany,
  StaticConnectionType
} from '../interfaces'
import { getOrCreateEdgeType } from './edge.type'
import { getOrCreatePageInfoType } from './page-info.type'
import { createPager } from './pager'

const DEFAULT_COUNT = () => Promise.reject(new NotImplementedException('totalCount not implemented'))

const reflector = new MapReflector('nestjs-query:cursor-connection-type')

function getOrCreateConnectionName<DTO>(DTOClass: Class<DTO>, opts: CursorConnectionOptions): string {
  const { connectionName } = opts
  if (connectionName) {
    return connectionName
  }
  const objName = getGraphqlObjectName(DTOClass, 'Unable to make ConnectionType.')
  return `${objName}Connection`
}

/**
 * An edge exposing pivot properties cannot be shared between connections of the same DTO, so it is
 * named after the connection it belongs to (`UserGroupsConnection` -> `UserGroupsEdge`).
 */
function getEdgeName(connectionName: string): string {
  const suffix = 'Connection'
  const baseName = connectionName.endsWith(suffix) ? connectionName.slice(0, -suffix.length) : connectionName
  return `${baseName}Edge`
}

export function getOrCreateCursorConnectionType<DTO>(
  TItemClass: Class<DTO>,
  maybeOpts?: CursorConnectionOptions
): StaticConnectionType<DTO, PagingStrategies.CURSOR> {
  const opts = maybeOpts ?? { pagingStrategy: PagingStrategies.CURSOR }
  const connectionName = getOrCreateConnectionName(TItemClass, opts)
  return reflector.memoize(TItemClass, connectionName, () => {
    const pager = createPager<DTO>(TItemClass, opts)
    const E = opts.edgePivot
      ? getOrCreateEdgeType(TItemClass, { pivot: opts.edgePivot, edgeName: getEdgeName(connectionName) })
      : getOrCreateEdgeType(TItemClass)
    const PIT = getOrCreatePageInfoType()

    @ObjectType(connectionName)
    class AbstractConnection implements CursorConnectionType<DTO> {
      static get resolveType() {
        return this
      }

      static async createFromPromise<Q extends Query<DTO>>(
        queryMany: QueryMany<DTO, Q>,
        query: Q,
        count?: Count<DTO>,
        connectionOpts?: CreateConnectionOptions<DTO>
      ): Promise<AbstractConnection> {
        const { pageInfo, edges, totalCount } = await pager.page(queryMany, query, count ?? DEFAULT_COUNT)
        const pivot = connectionOpts?.pivot
        return new AbstractConnection(
          // create the appropriate graphql instance
          new PIT(pageInfo.hasNextPage, pageInfo.hasPreviousPage, pageInfo.startCursor, pageInfo.endCursor),
          edges.map(({ node, cursor }) => new E(node, cursor, pivot ? () => pivot(node) : undefined)),
          totalCount
        )
      }

      private readonly totalCountFn: CountFn

      constructor(pageInfo?: PageInfoType, edges?: EdgeType<DTO>[], totalCountFn?: CountFn) {
        this.pageInfo = pageInfo ?? { hasNextPage: false, hasPreviousPage: false }
        this.edges = edges ?? []
        this.totalCountFn = totalCountFn ?? DEFAULT_COUNT
      }

      @Field(() => PIT, { description: 'Paging information' })
      pageInfo!: PageInfoType

      @Field(() => [E], { description: 'Array of edges.' })
      edges!: EdgeType<DTO>[]

      @SkipIf(() => !opts.enableTotalCount, Field(() => Int, { description: 'Fetch total count of records' }))
      get totalCount(): Promise<number> {
        return this.totalCountFn()
      }
    }

    return AbstractConnection
  })
}
