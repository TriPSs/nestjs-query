import { Type } from '@nestjs/common'
import { OmitType } from '@nestjs/swagger'
import { Class } from '@ptc-org/nestjs-query-core'

import { getIDFields } from '../decorators'

export interface MutationArgsType<Input> {
  input: Input
}

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function MutationArgsType<Input>(InputClass: Class<Input>): Class<MutationArgsType<Input>> {
  const dtoIDFields = getIDFields(InputClass) || []
  const properties = dtoIDFields.filter(({ idOnly }) => idOnly).map(({ propertyName }) => propertyName)

  class MutationArgs extends OmitType(InputClass as Type, properties) implements MutationArgsType<Input> {
    // For create
    public get input() {
      return this as never as Input
    }

    // For update
    public get update() {
      return this as never as Input
    }
  }

  return MutationArgs
}
