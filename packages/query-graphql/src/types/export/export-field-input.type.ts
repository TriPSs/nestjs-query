import { Field, InputType } from '@nestjs/graphql'
import { Class, MapReflector } from '@ptc-org/nestjs-query-core'
import { IsIn, IsOptional, IsString } from 'class-validator'

import { getGraphqlObjectName } from '../../common'
import { getDTOFields } from './export-args.helpers'

const reflector = new MapReflector('nestjs-query:export-field-type')

function getObjectTypeName<DTO>(DTOClass: Class<DTO>): string {
  return getGraphqlObjectName(DTOClass, 'No fields found to create ExportFieldInputType.')
}

export interface ExportFieldInput {
  field: string
  label?: string
}

export function getOrCreateExportFieldInputType<DTO>(TClass: Class<DTO>): Class<ExportFieldInput> {
  const typeName = `Export${getObjectTypeName(TClass)}Field`
  return reflector.memoize(TClass, typeName, () => {
    const fields = getDTOFields(TClass)

    @InputType(typeName)
    class ExportFieldInput implements ExportFieldInput {
      @Field(() => String, {
        description: 'The field to export. Must be one of:\n' + fields.join('\n')
      })
      @IsIn(fields)
      @IsString()
      field!: string

      @Field(() => String, {
        nullable: true,
        description: 'Optional column label for the field.'
      })
      @IsOptional()
      @IsString()
      label?: string
    }

    return ExportFieldInput
  })
}
