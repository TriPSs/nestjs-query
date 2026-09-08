import { Class } from '@ptc-org/nestjs-query-core'

export interface UpdateOneInputType<U> {
  update: U
}

/**
 * The abstract input type for update one operations.
 *
 * @param UpdateClass - The class used as the request body input.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function UpdateOneInputType<U>(UpdateClass: Class<U>): Class<UpdateOneInputType<U>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class UpdateOneInput extends UpdateClass implements UpdateOneInputType<U> {
    public get update() {
      return this as never as U
    }
  }

  return UpdateOneInput
}
