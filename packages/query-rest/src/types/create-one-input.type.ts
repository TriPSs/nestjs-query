import { Class } from '@ptc-org/nestjs-query-core'

export interface CreateOneInputType<C> {
  input: C
}

/**
 * The abstract input type for create one operations.
 *
 * @param fieldName - The name of the field to be exposed in the graphql schema
 * @param InputClass - The InputType to be used.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function CreateOneInputType<C>(InputClass: Class<C>): Class<CreateOneInputType<C>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class CreateOneInput extends InputClass implements CreateOneInputType<C> {
    public get input() {
      return this as never as C
    }
  }

  return CreateOneInput
}
