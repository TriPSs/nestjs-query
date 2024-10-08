import { PickType } from '@nestjs/swagger'
import { Class } from '@ptc-org/nestjs-query-core'

import { getIDField } from '../decorators'

export interface FindOneArgsType {
  id: string | number
}

/**
 * The input type for "one" endpoints.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function FindOneArgsType(DTOClass: Class<unknown>): Class<FindOneArgsType> {
  const dtoWithIDField = getIDField(DTOClass)

  class FindOneArgs extends PickType(DTOClass, [dtoWithIDField.propertyName] as never) implements FindOneArgsType {
    id: string | number
  }

  return FindOneArgs
}
