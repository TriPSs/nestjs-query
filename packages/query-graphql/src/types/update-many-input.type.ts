import { Field, InputType } from '@nestjs/graphql';
import { Class, DeepPartial, Filter } from '@rezonate/nestjs-query-core';
import { Type } from 'class-transformer';
import { IsNotEmptyObject, ValidateNested } from 'class-validator';

import { UpdateFilterType } from './query';

export interface UpdateManyInputType<DTO> {
  filter: Filter<DTO>
  update: DeepPartial<DTO>
}

/**
 * Input abstract type for all update many endpoints.
 * @param DTOClass - The DTO used to create a FilterType for the update.
 * @param UpdateType - The InputType to use for the update field.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function UpdateManyInputType<DTO>(DTOClass: Class<DTO>, UpdateType: Class<DeepPartial<DTO>>): Class<UpdateManyInputType<DTO>> {
  const F = UpdateFilterType(DTOClass);

  @InputType({ isAbstract: true })
  class UpdateManyInput implements UpdateManyInputType<DTO> {
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => F)
    @Field(() => F, { description: 'Filter used to find fields to update' })
    filter!: Filter<DTO>;

    @Type(() => UpdateType)
    @ValidateNested()
    @Field(() => UpdateType, { description: 'The update to apply to all records found using the filter' })
    update!: DeepPartial<DTO>;
  }

  return UpdateManyInput;
}
