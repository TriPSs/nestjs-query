import { Class } from '@ptc-org/nestjs-query-core'

import { getOrCreateArrayConnectionType } from '../../../connection/array-connection.type'
import { Field, SkipIf } from '../../../decorators'
import { RestQuery } from '../../../types'
import { BuildableQueryType } from '../buildable-query.type'
import { FilterType } from '../filter.type'
import { PagingStrategies } from '../paging'
import { createSortingQueryArgs } from '../sorting.type'
import { DEFAULT_QUERY_OPTS } from './constants'
import { NonePagingQueryArgsTypeOpts, StaticQueryType } from './interfaces'

export function createNonePagingQueryArgs<DTO>(
  DTOClass: Class<DTO>,
  opts: NonePagingQueryArgsTypeOpts<DTO> = { ...DEFAULT_QUERY_OPTS, pagingStrategy: PagingStrategies.NONE }
): StaticQueryType<DTO, PagingStrategies.NONE> {
  const ConnectionType = getOrCreateArrayConnectionType(DTOClass, opts)

  class QueryNonPagingArgs extends createSortingQueryArgs(DTOClass, opts) implements BuildableQueryType<DTO> {
    static ConnectionType = ConnectionType

    public get filter() {
      return opts.defaultFilter
    }

    @SkipIf(
      () => !opts.enableSearch,
      Field({
        description: 'A search query to filter results by.',
        nullable: true,
        required: false
      })
    )
    public query?: string

    public buildQuery(): RestQuery<DTO> {
      return {
        query: this.query,
        filter: this.filter,
        sorting: this.sorting,
        relations: []
      }
    }
  }

  if (opts.disableFilter) {
    return QueryNonPagingArgs
  }

  return FilterType<DTO>(DTOClass, QueryNonPagingArgs) as never
}
