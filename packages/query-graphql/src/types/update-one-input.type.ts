import { Field, InputType } from '@nestjs/graphql';
import { Class, DeepPartial } from '@rezonate/nestjs-query-core';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { getDTOIdTypeOrDefault } from '../common';

export interface UpdateOneInputType<DTO> {
  id: string | number
  update: DeepPartial<DTO>
}

/**
 * The abstract input type for update one endpoints.
 * @param DTOClass - The base DTO class the UpdateType is based on.
 * @param UpdateType - The InputType to use for the update field.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function UpdateOneInputType<DTO>(DTOClass: Class<DTO>, UpdateType: Class<DeepPartial<DTO>>): Class<UpdateOneInputType<DTO>> {
  const IDType = getDTOIdTypeOrDefault([DTOClass, UpdateType]);

  @InputType({ isAbstract: true })
  class UpdateOneInput implements UpdateOneInputType<DTO> {
    @IsNotEmpty()
    @Field(() => IDType, { description: 'The id of the record to update' })
    id!: string | number;

    @Type(() => UpdateType)
    @ValidateNested()
    @Field(() => UpdateType, { description: 'The update to apply.' })
    update!: DeepPartial<DTO>;
  }

  return UpdateOneInput;
}
