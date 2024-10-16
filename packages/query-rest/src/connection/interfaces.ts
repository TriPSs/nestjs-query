import { Class, Filter, Query } from '@ptc-org/nestjs-query-core'

import { PagingStrategies } from '../types'

interface BaseConnectionOptions {
  enableTotalCount?: boolean
  connectionName?: string
}

export interface OffsetConnectionOptions extends BaseConnectionOptions {
  pagingStrategy?: PagingStrategies.OFFSET
}

export interface ArrayConnectionOptions extends BaseConnectionOptions {
  pagingStrategy?: PagingStrategies.NONE
}

export type ConnectionOptions = OffsetConnectionOptions | ArrayConnectionOptions

export interface OffsetPageInfoType {
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type OffsetConnectionType<DTO> = {
  pageInfo: OffsetPageInfoType
  totalCount?: number
  nodes: DTO[]
}

export type ArrayConnectionType<DTO> = DTO[]

export type ConnectionType<DTO> = OffsetConnectionType<DTO> | ArrayConnectionType<DTO>

export type QueryMany<DTO, Q extends Query<DTO>> = (query: Q) => Promise<DTO[]>
export type Count<DTO> = (filter: Filter<DTO>) => Promise<number>

export type PagerResult = {
  totalCount?: number
}

export interface Pager<DTO, R extends PagerResult> {
  page<Q extends Query<DTO>>(queryMany: QueryMany<DTO, Q>, query: Q, count?: Count<DTO>): Promise<R>
}

export type InferConnectionTypeFromStrategy<DTO, S extends PagingStrategies> = S extends PagingStrategies.NONE
  ? ArrayConnectionType<DTO>
  : S extends PagingStrategies.OFFSET
  ? OffsetConnectionType<DTO>
  : never

export interface StaticConnectionType<DTO, S extends PagingStrategies> extends Class<InferConnectionTypeFromStrategy<DTO, S>> {
  createFromPromise<Q extends Query<DTO>>(
    queryMany: QueryMany<DTO, Q>,
    query: Q,
    count?: Count<DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, S>>
}
