import { Paging } from '@ptc-org/nestjs-query-core'

import { PagingStrategies } from './constants'

export type NonePagingType = Paging
export type OffsetPagingType = Paging

// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
export type PagingTypes = OffsetPagingType | NonePagingType
export type InferPagingTypeFromStrategy<PS extends PagingStrategies> = PS extends PagingStrategies.OFFSET
  ? OffsetPagingType
  : PS extends PagingStrategies.NONE
  ? NonePagingType
  : never
