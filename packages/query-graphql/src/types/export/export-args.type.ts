import { ArgsType, Field } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'
import { Type } from 'class-transformer'
import { ArrayMinSize, ArrayUnique, IsArray, ValidateNested } from 'class-validator'

import { ExportFieldInput, getOrCreateExportFieldInputType } from './export-field-input.type'

export interface ExportArgsType {
  fields: ExportFieldInput[]
}

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function ExportArgsType<DTO, ExportDTO = DTO>(
  DTOClass: Class<DTO>,
  ExportDTOClass?: Class<ExportDTO>
): Class<ExportArgsType> {
  const EFI = getOrCreateExportFieldInputType(DTOClass, ExportDTOClass)

  @ArgsType()
  class ExportArgs implements ExportArgsType {
    @Type(() => EFI)
    @ValidateNested({ each: true })
    @Field(() => [EFI], {
      description:
        'CSV columns in the requested order. Select at least one field using its GraphQL schema name; duplicate fields are not allowed. Relation fields support one level of dot notation (e.g. owner.name). Set label to customize a column header; otherwise, the field name is used.'
    })
    @ArrayUnique((value: ExportFieldInput) => value?.field)
    @ArrayMinSize(1)
    @IsArray()
    fields!: ExportFieldInput[]
  }

  return ExportArgs
}
