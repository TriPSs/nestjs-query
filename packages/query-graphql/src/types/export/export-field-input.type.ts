import { Field, InputType } from '@nestjs/graphql'
import { Class, MapReflector } from '@ptc-org/nestjs-query-core'
import { IsIn, IsOptional, IsString } from 'class-validator'

import { getGraphqlObjectName } from '../../common'
import { getDTOFields } from './export-args.helpers'

const reflector = new MapReflector<Class<unknown> | string>('nestjs-query:export-field-type')

function getObjectTypeName<DTO>(DTOClass: Class<DTO>): string {
  return getGraphqlObjectName(DTOClass, 'No fields found to create ExportFieldInputType.')
}

export interface ExportFieldInput {
  field: string
  label?: string
}

export function getOrCreateExportFieldInputType<DTO, ExportDTO = DTO>(
  TClass: Class<DTO>,
  ExportDTOClass?: Class<ExportDTO>
): Class<ExportFieldInput> {
  const className = getObjectTypeName<DTO | ExportDTO>(ExportDTOClass ?? TClass)
  const typeName = `Export${className}Field`

  return reflector.memoize<DTO | ExportDTO, Class<ExportFieldInput>>(ExportDTOClass ?? TClass, typeName, () => {
    const fields = getDTOFields<DTO | ExportDTO>(ExportDTOClass ?? TClass)

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
