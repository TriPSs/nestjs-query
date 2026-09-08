import { Class } from '@ptc-org/nestjs-query-core'

import { PagingStrategies } from './constants'
import { NonePagingType } from './interfaces'

let nonePaging: Class<NonePagingType> | null = null
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const getOrCreateNonePagingType = (): Class<NonePagingType> => {
  if (nonePaging) {
    return nonePaging
  }

  class NonePagingImpl implements NonePagingType {
    static strategy: PagingStrategies.NONE = PagingStrategies.NONE
  }

  nonePaging = NonePagingImpl
  return nonePaging
}
