import { Type } from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'

export interface MutationArgsType<Input> {
  input: Input
}

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function MutationArgsType<Input>(InputClass: Class<Input>): Class<MutationArgsType<Input>> {
  class MutationArgs extends (InputClass as Type) implements MutationArgsType<Input> {
    public get input() {
      return this as never as Input
    }
  }

  return MutationArgs
}
