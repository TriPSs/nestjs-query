import { ArgsType, Field } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator'

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
      description: 'Fields to include in the export. You can assign labels to fields using the label property.'
    })
    @ArrayMinSize(1)
    @IsArray()
    fields!: ExportFieldInput[]
  }

  return ExportArgs
}
