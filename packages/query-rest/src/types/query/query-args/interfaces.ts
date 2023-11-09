import { Class, Filter, Query, SortField } from '@ptc-org/nestjs-query-core'

import { ArrayConnectionOptions, OffsetConnectionOptions, StaticConnectionType } from '../../../connection/interfaces'
import { InferPagingTypeFromStrategy, PagingStrategies } from '../paging'

export type BaseQueryArgsTypeOpts<DTO> = {
  /**
   * Support the `query=term` query param which can be used inside the before query many
   * to build an filter
   */
  enableSearch?: boolean
  /**
   * The default number of results to return.
   * [Default=10]
   */
  defaultResultSize?: number
  /**
   * The maximum number of results that can be returned from a query.
   * [Default=50]
   */
  maxResultsSize?: number
  /**
   * The default sort for queries.
   * [Default=[]]
   */
  defaultSort?: SortField<DTO>[]
  /**
   * Disable the sorting
   */
  disableSort?: boolean
  /**
   * Default filter.
   * [Default=\{\}]
   */
  defaultFilter?: Filter<DTO>
  /**
   * Disable the filtering
   */
  disableFilter?: boolean
}

export interface OffsetQueryArgsTypeOpts<DTO> extends BaseQueryArgsTypeOpts<DTO>, OffsetConnectionOptions {
  pagingStrategy?: PagingStrategies.OFFSET
}

export interface NonePagingQueryArgsTypeOpts<DTO> extends BaseQueryArgsTypeOpts<DTO>, ArrayConnectionOptions {
  pagingStrategy?: PagingStrategies.NONE
}

export type QueryArgsTypeOpts<DTO> = OffsetQueryArgsTypeOpts<DTO> | NonePagingQueryArgsTypeOpts<DTO>

export interface StaticQueryType<DTO, PS extends PagingStrategies> extends Class<QueryType<DTO, PS>> {
  SortType: Class<SortField<DTO>>
  PageType: Class<InferPagingTypeFromStrategy<PS>>
  FilterType: Class<Filter<DTO>>
  ConnectionType: StaticConnectionType<DTO, PS>
}

export interface QueryType<DTO, PS extends PagingStrategies> extends Query<DTO> {
  paging?: InferPagingTypeFromStrategy<PS>
}
