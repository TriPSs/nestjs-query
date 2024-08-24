import { ArgsType, Field } from '@nestjs/graphql'
import { Class, Filter, HavingFilter } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

import { AggregateFilterType, AggregateHavingFilterType } from '../query'

export interface AggregateArgsType<DTO> {
  filter?: Filter<DTO>
  having?: HavingFilter<DTO>
}

/**
 * The args type for aggregate queries
 * @param DTOClass - The class the aggregate is for. This will be used to create FilterType.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function AggregateArgsType<DTO>(DTOClass: Class<DTO>): Class<AggregateArgsType<DTO>> {
  const F = AggregateFilterType(DTOClass)
  const HF = AggregateHavingFilterType(DTOClass)

  @ArgsType()
  class AggregateArgs implements AggregateArgsType<DTO> {
    @Type(() => F)
    @ValidateNested()
    @Field(() => F, { nullable: true, description: 'Filter to find records to aggregate on' })
    filter?: Filter<DTO>

    @Type(() => HF)
    @ValidateNested()
    @Field(() => HF, { nullable: true, description: 'having filter to find records to aggregate on' })
    having?: HavingFilter<DTO>
  }

  return AggregateArgs
}
