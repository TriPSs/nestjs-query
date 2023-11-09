import { Class } from '@ptc-org/nestjs-query-core'

export interface UpdateOneInputType<U> {
  update: U
}

/**
 * The abstract input type for create one operations.
 *
 * @param fieldName - The name of the field to be exposed in the graphql schema
 * @param UpdateClass - The InputType to be used.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function UpdateOneInputType<DTO, U>(DTOClass: Class<DTO>, UpdateClass: Class<U>): Class<UpdateOneInputType<U>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class UpdateOneInput extends UpdateClass implements UpdateOneInputType<U> {

    public get update() {
      return this as never as U
    }

  }

  Object.defineProperty(UpdateOneInput, 'name', {
    writable: false,
    // set a unique name otherwise DI does not inject a unique one for each request
    value: `Update${DTOClass.name}`
  })

  return UpdateOneInput
}
