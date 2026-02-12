import { Class } from '@ptc-org/nestjs-query-core'
import { RestQuery } from '@ptc-org/nestjs-query-rest'

import { getOrCreateOffsetConnectionType } from '../../../connection/offset/offset-connection.type'
import { Field, SkipIf } from '../../../decorators'
import { BuildableQueryType } from '../buildable-query.type'
import { FilterType } from '../filter.type'
import { OffsetPaging } from '../offset-paging.type'
import { PagingStrategies } from '../paging'
import { DEFAULT_QUERY_OPTS } from './constants'
import { OffsetQueryArgsTypeOpts, StaticQueryType } from './interfaces'

export function createOffsetQueryArgs<DTO>(
  DTOClass: Class<DTO>,
  opts: OffsetQueryArgsTypeOpts<DTO> = { ...DEFAULT_QUERY_OPTS, pagingStrategy: PagingStrategies.OFFSET }
): StaticQueryType<DTO, PagingStrategies.OFFSET> {
  // const S = getOrCreateSortType(DTOClass)

  const ConnectionType = getOrCreateOffsetConnectionType(DTOClass, opts)

  class QueryArgs extends OffsetPaging implements BuildableQueryType<DTO> {
    static ConnectionType = ConnectionType

    public sorting = opts.defaultSort

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
        paging: {
          limit: this.limit || opts.maxResultsSize,
          offset: this.offset
        },
        filter: this.filter,
        sorting: this.sorting,
        relations: []
      }
    }
  }

  return FilterType<DTO>(DTOClass, QueryArgs) as never as StaticQueryType<DTO, PagingStrategies.OFFSET>
}
