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
import { createOffsetQueryArgs } from './query/query-args/offset-query-args.type'

const getMergedQueryOpts = <DTO>(DTOClass: Class<DTO>, opts?: QueryArgsTypeOpts<DTO>): QueryArgsTypeOpts<DTO> => {
  const decoratorOpts = getQueryOptions(DTOClass)
  return {
    ...DEFAULT_QUERY_OPTS,
    pagingStrategy: PagingStrategies.OFFSET,
    ...removeUndefinedValues(decoratorOpts ?? {}),
    ...removeUndefinedValues(opts ?? {})
  }
}

// tests if the object is a QueryArgs Class
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isStaticQueryArgsType = <DTO>(obj: any): obj is StaticQueryType<DTO, PagingStrategies> =>
  typeof obj === 'function' && 'PageType' in obj && 'SortType' in obj && 'FilterType' in obj

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

  // TODO:: Support none paging type
  return createOffsetQueryArgs(DTOClass, mergedOpts as never)
  //   return createNonePagingQueryArgsType(DTOClass, mergedOpts)
}
