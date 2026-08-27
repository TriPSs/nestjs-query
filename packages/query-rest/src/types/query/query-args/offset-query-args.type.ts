import { Class, Paging } from '@ptc-org/nestjs-query-core'

import { getOrCreateOffsetConnectionType } from '../../../connection/offset/offset-connection.type'
import { Field, SkipIf } from '../../../decorators'
import { RestQuery } from '../../../types'
import { BuildableQueryType } from '../buildable-query.type'
import { FilterType } from '../filter.type'
import { PagingStrategies } from '../paging'
import { DEFAULT_QUERY_OPTS } from './constants'
import { OffsetQueryArgsTypeOpts, StaticQueryType } from './interfaces'

export function createOffsetQueryArgs<DTO>(
  DTOClass: Class<DTO>,
  opts: OffsetQueryArgsTypeOpts<DTO> = { ...DEFAULT_QUERY_OPTS, pagingStrategy: PagingStrategies.OFFSET }
): StaticQueryType<DTO, PagingStrategies.OFFSET> {
  const ConnectionType = getOrCreateOffsetConnectionType(DTOClass, opts)
  const defaultResultSize = opts.defaultResultSize ?? DEFAULT_QUERY_OPTS.defaultResultSize
  const maxResultsSize = opts.maxResultsSize ?? DEFAULT_QUERY_OPTS.maxResultsSize

  class QueryArgs implements Paging, BuildableQueryType<DTO> {
    static ConnectionType = ConnectionType

    @Field({
      type: Number,
      description: 'The maximum number of results to return.',
      nullable: true,
      default: defaultResultSize,
      minimum: 1,
      maximum: maxResultsSize
    })
    limit?: number

    @Field({
      type: Number,
      description: 'The offset to start returning results from.',
      nullable: true,
      required: false,
      minimum: 0,
      default: 0
    })
    offset?: number

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
          limit: this.limit || defaultResultSize,
          offset: this.offset
        },
        filter: this.filter,
        sorting: this.sorting,
        relations: []
      }
    }
  }

  if (opts.disableFilter) {
    return QueryArgs as StaticQueryType<DTO, PagingStrategies.OFFSET>
  }

  return FilterType<DTO>(DTOClass, QueryArgs) as never as StaticQueryType<DTO, PagingStrategies.OFFSET>
}
