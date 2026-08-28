import { Class } from '@ptc-org/nestjs-query-core'

import { Field } from '../../decorators'
import { OffsetPageInfoType } from '../interfaces'

export interface OffsetPageInfoTypeConstructor {
  new (hasNextPage: boolean, hasPreviousPage: boolean): OffsetPageInfoType
}

/** @internal */
let pageInfoType: Class<OffsetPageInfoType> | null = null
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const getOrCreateOffsetPageInfoType = (): OffsetPageInfoTypeConstructor => {
  if (pageInfoType) {
    return pageInfoType
  }

  class PageInfoType implements OffsetPageInfoType {
    constructor(hasNextPage: boolean, hasPreviousPage: boolean) {
      this.hasNextPage = hasNextPage
      this.hasPreviousPage = hasPreviousPage
    }

    @Field({
      description: '`true` if paging forward and there are more records.'
    })
    hasNextPage: boolean

    @Field({
      description: '`true` if paging backwards and there are more records.'
    })
    hasPreviousPage: boolean
  }

  pageInfoType = PageInfoType
  return pageInfoType
}
