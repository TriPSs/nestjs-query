import { Class } from '@ptc-org/nestjs-query-core'
import { Field, getMergedQueryOpts, RestQuery, SkipIf } from '@ptc-org/nestjs-query-rest'

import { BuildableQueryType } from '../buildable-query.type'
import { ExportFilterType } from '../filter.type'
import { PagingStrategies } from '../paging'
import { DEFAULT_QUERY_OPTS } from './constants'
import { NonePagingQueryArgsTypeOpts, StaticQueryType } from './interfaces'

export function createExportQueryArgs<DTO>(
  DTOClass: Class<DTO>,
  opts: NonePagingQueryArgsTypeOpts<DTO> = { ...DEFAULT_QUERY_OPTS, pagingStrategy: PagingStrategies.NONE }
): StaticQueryType<DTO, PagingStrategies.NONE> {
  const mergedOpts = getMergedQueryOpts(DTOClass, opts)

  class ExportQueryArgs implements BuildableQueryType<DTO> {
    public sorting = mergedOpts.defaultSort

    public get filter() {
      return mergedOpts.defaultFilter
    }

    @SkipIf(
      () => !mergedOpts.enableSearch,
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

  return ExportFilterType<DTO>(DTOClass, ExportQueryArgs) as never as StaticQueryType<DTO, PagingStrategies.NONE>
}
