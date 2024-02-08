import { Class } from '@ptc-org/nestjs-query-core'

import { getOrCreateOffsetConnectionType } from '../../../connection/offset/offset-connection.type'
import { Field, SkipIf } from '../../../decorators'
import { RestQuery } from '../../rest-query.type'
import { BuildableQueryType } from '../buildable-query.type'
import { OffsetPaging } from '../offset-paging.type'
import { PagingStrategies } from '../paging'
import { DEFAULT_QUERY_OPTS } from './constants'
import { OffsetQueryArgsTypeOpts, StaticQueryType } from './interfaces'

export function createOffsetQueryArgs<DTO>(
  DTOClass: Class<DTO>,
  opts: OffsetQueryArgsTypeOpts<DTO> = { ...DEFAULT_QUERY_OPTS, pagingStrategy: PagingStrategies.OFFSET }
): StaticQueryType<DTO, PagingStrategies.OFFSET> {
  // const F = FilterType(DTOClass)
  // const S = getOrCreateSortType(DTOClass)
  const ConnectionType = getOrCreateOffsetConnectionType(DTOClass, opts)

  class QueryArgs extends OffsetPaging implements BuildableQueryType<DTO> {
    static SortType = null

    static FilterType = null

    static ConnectionType = ConnectionType

    static PageType = OffsetPaging

    public sorting = opts.defaultSort

    public filter = opts.defaultFilter

    @SkipIf(
      () => !opts.enableSearch,
      Field({
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

  return QueryArgs
}
