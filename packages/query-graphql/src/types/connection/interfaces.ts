import { ReturnTypeFuncValue } from '@nestjs/graphql'
import { Class, Filter, Query } from '@ptc-org/nestjs-query-core'

import { ConnectionCursorType } from '../cursor.scalar'
import { PagingStrategies } from '../query'

export const DEFAULT_PIVOT_FIELD_NAME = 'properties'

/**
 * Options used to expose the properties of a pivot (a.k.a. join/through) record on an edge.
 */
export interface EdgePivotOptions<Pivot> {
  /**
   * The class type of the pivot record.
   */
  DTO: Class<Pivot>
  /**
   * The name of the field to expose the pivot record on.
   * [Default=properties]
   */
  fieldName?: string
  /**
   * Description of the pivot field.
   */
  description?: string
  /**
   * Allow filtering the connection by the properties of the relationship.
   */
  enableFilter?: boolean
}

interface BaseConnectionOptions {
  enableTotalCount?: boolean
  connectionName?: string
  disableKeySetPagination?: boolean
  enableFetchAllWithNegative?: boolean
  /**
   * Expose the properties of the pivot record that ties the parent to the node on each edge.
   *
   * Set by the relation resolver from its own `pivot` option, once everything has been resolved.
   * Only supported by the cursor paging strategy, since it is the only one that creates edges.
   */
  edgePivot?: EdgePivotOptions<unknown>
}

export interface CursorConnectionOptions extends BaseConnectionOptions {
  pagingStrategy?: PagingStrategies.CURSOR
}

export interface OffsetConnectionOptions extends BaseConnectionOptions {
  pagingStrategy?: PagingStrategies.OFFSET
}

export interface ArrayConnectionOptions extends BaseConnectionOptions {
  pagingStrategy?: PagingStrategies.NONE
}

export type ConnectionOptions = CursorConnectionOptions | OffsetConnectionOptions | ArrayConnectionOptions

export interface EdgeType<DTO> {
  node: DTO
  cursor: ConnectionCursorType
}

export interface PageInfoType {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor?: ConnectionCursorType | undefined
  endCursor?: ConnectionCursorType | undefined
}

export type CursorConnectionType<DTO> = {
  pageInfo: PageInfoType
  edges: EdgeType<DTO>[]
  totalCount?: Promise<number>
}

export interface OffsetPageInfoType {
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type OffsetConnectionType<DTO> = {
  pageInfo: OffsetPageInfoType
  totalCount?: Promise<number>
  nodes: DTO[]
}

export type ArrayConnectionType<DTO> = DTO[]

export type ConnectionType<DTO> = OffsetConnectionType<DTO> | CursorConnectionType<DTO> | ArrayConnectionType<DTO>

export type InferConnectionTypeFromStrategy<DTO, S extends PagingStrategies> = S extends PagingStrategies.NONE
  ? ArrayConnectionType<DTO>
  : S extends PagingStrategies.OFFSET
    ? OffsetConnectionType<DTO>
    : S extends PagingStrategies.CURSOR
      ? CursorConnectionType<DTO>
      : never

export type QueryMany<DTO, Q extends Query<DTO>> = (query: Q) => Promise<DTO[]>
export type Count<DTO> = (filter: Filter<DTO>) => Promise<number>

/**
 * Resolves the pivot record that ties the connection's parent to `node`.
 */
export type PivotFn<DTO, Pivot = unknown> = (node: DTO) => Promise<Pivot | undefined>

export interface CreateConnectionOptions<DTO> {
  /**
   * Called lazily, once per edge, when the pivot field is selected.
   */
  pivot?: PivotFn<DTO>
}

export type CountFn = () => Promise<number>

export type PagerResult = {
  totalCount: CountFn
}

export interface Pager<DTO, R extends PagerResult> {
  page<Q extends Query<DTO>>(queryMany: QueryMany<DTO, Q>, query: Q, count: Count<DTO>): Promise<R>
}

export interface StaticConnectionType<DTO, S extends PagingStrategies> extends Class<InferConnectionTypeFromStrategy<DTO, S>> {
  resolveType: ReturnTypeFuncValue

  createFromPromise<Q extends Query<DTO>>(
    queryMany: QueryMany<DTO, Q>,
    query: Q,
    count?: Count<DTO>,
    opts?: CreateConnectionOptions<DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, S>>
}
