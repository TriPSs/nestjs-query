import { ArgsType, Field } from '@nestjs/graphql'
import { Class, Filter } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

import { AggregateFilterType } from '../query'

export interface AggregateArgsType<DTO> {
  filter?: Filter<DTO>
  groupByLimit?: number
}

/**
 * The args type for aggregate queries
 * @param DTOClass - The class the aggregate is for. This will be used to create FilterType.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function AggregateArgsType<DTO>(DTOClass: Class<DTO>): Class<AggregateArgsType<DTO>> {
  const F = AggregateFilterType(DTOClass)

  @ArgsType()
  class AggregateArgs implements AggregateArgsType<DTO> {
    @Type(() => F)
    @ValidateNested()
    @Field(() => F, { nullable: true, description: 'Filter to find records to aggregate on' })
    filter?: Filter<DTO>

    @Field(() => Number, { nullable: true, description: 'Limit the number of results group by aggregation can return' })
    groupByLimit?: number
  }

  return AggregateArgs
}
