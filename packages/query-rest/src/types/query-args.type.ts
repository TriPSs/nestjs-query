import { Class } from '@ptc-org/nestjs-query-core'

import { removeUndefinedValues } from '../common'
import { getQueryOptions } from '../decorators'
import {
  DEFAULT_QUERY_OPTS,
  NonePagingQueryArgsTypeOpts,
  OffsetQueryArgsTypeOpts,
  PagingStrategies,
  QueryArgsTypeOpts,
  StaticQueryType
} from './query'
import { createNonePagingQueryArgs } from './query/query-args/none-paging-query-args.type'
import { createOffsetQueryArgs } from './query/query-args/offset-query-args.type'

export const getMergedQueryOpts = <DTO>(DTOClass: Class<DTO>, opts?: QueryArgsTypeOpts<DTO>): QueryArgsTypeOpts<DTO> => {
  const decoratorOpts = getQueryOptions(DTOClass)
  return {
    ...DEFAULT_QUERY_OPTS,
    pagingStrategy: PagingStrategies.OFFSET,
    ...removeUndefinedValues(decoratorOpts ?? {}),
    ...removeUndefinedValues(opts ?? {})
  }
}

export function QueryArgsType<DTO>(
  DTOClass: Class<DTO>,
  opts: OffsetQueryArgsTypeOpts<DTO>
): StaticQueryType<DTO, PagingStrategies.OFFSET>
export function QueryArgsType<DTO>(
  DTOClass: Class<DTO>,
  opts: NonePagingQueryArgsTypeOpts<DTO>
): StaticQueryType<DTO, PagingStrategies.NONE>

export function QueryArgsType<DTO>(DTOClass: Class<DTO>, opts?: QueryArgsTypeOpts<DTO>): StaticQueryType<DTO, PagingStrategies>
export function QueryArgsType<DTO>(DTOClass: Class<DTO>, opts?: QueryArgsTypeOpts<DTO>): StaticQueryType<DTO, PagingStrategies> {
  // override any options from the DTO with the options passed in
  const mergedOpts = getMergedQueryOpts(DTOClass, opts)
  if (mergedOpts.pagingStrategy === PagingStrategies.OFFSET) {
    return createOffsetQueryArgs(DTOClass, mergedOpts)
  }

  return createNonePagingQueryArgs(DTOClass, mergedOpts)
}
