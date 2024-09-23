import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql'
import { AggregateByTimeIntervalSpan, Class, Filter, SortDirection, SortNulls } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import { IsEnum, IsIn, ValidateNested } from 'class-validator'

import { getGraphqlObjectName } from '../../common'
import { getFilterableFields } from '../../decorators'
import { getFilterableRelationFieldsNames } from '../../decorators/filterable-field.decorator'
import { AggregateFilterType } from '../query'
import { IsUndefined } from '../validators'

export interface AggregateByTimeArgsType<DTO> {
  filter?: Filter<DTO>
  groupByLimit?: number
  field: string
  from: Date
  to?: Date
  interval: AggregateByTimeInterval
}

registerEnumType(AggregateByTimeIntervalSpan, { name: 'AggregateByTimeIntervalSpan' })

@InputType()
class AggregateByTimeInterval {
  @Field(() => Number, { nullable: true, description: 'number of interval time spans (default 1)' })
  count: number

  @Field(() => AggregateByTimeIntervalSpan, { nullable: true, description: 'time span for interval (default day)' })
  span: AggregateByTimeIntervalSpan
}

const defaultAggregateByTimeInterval = new AggregateByTimeInterval()
defaultAggregateByTimeInterval.count = 1
defaultAggregateByTimeInterval.span = AggregateByTimeIntervalSpan.day

enum InvalidFields {
  InvalidFields = 'InvalidFields'
}

registerEnumType(InvalidFields, { name: 'InvalidFields' })

/**
 * The args type for aggregate queries
 * @param DTOClass - The class the aggregate is for. This will be used to create FilterType.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function AggregateByTimeArgsType<DTO>(DTOClass: Class<DTO>): Class<AggregateByTimeArgsType<DTO>> {
  const prefix = getGraphqlObjectName(DTOClass, 'Unable to make AggregateByTimeArgs.')
  const F = AggregateFilterType(DTOClass)

  const fields = getFilterableFields(DTOClass)

  const dateFieldNames = fields.filter((f) => f.returnTypeFunc?.() === Date).map((field) => field.propertyName)

  const fieldNameMap = {
    ...dateFieldNames.reduce((acc, field) => ({ ...acc, [field]: field }), {})
  }

  if (dateFieldNames.length) registerEnumType(fieldNameMap, { name: `${prefix}TimeFields` })

  @ArgsType()
  class AggregateByTimeArgs implements AggregateByTimeArgsType<DTO> {
    @Type(() => F)
    @ValidateNested()
    @Field(() => F, { nullable: true, description: 'Filter to find records to aggregate on' })
    filter?: Filter<DTO>

    @Field(() => Number, { nullable: true, description: 'Limit the number of results group by aggregation can return' })
    groupByLimit?: number

    @Field(() => (dateFieldNames.length ? fieldNameMap : InvalidFields), {
      nullable: false,
      description: 'Time field to aggregate by'
    })
    @IsIn(dateFieldNames)
    field: string

    @Field(() => Date, { nullable: false, description: 'Start date for aggregation by time' })
    from: Date

    @Field(() => Date, { nullable: true, description: 'End date for aggregation by time (default now)' })
    to?: Date

    @Field(() => AggregateByTimeInterval, { nullable: true, description: 'Aggregation intervals (default 1 day)' })
    interval: AggregateByTimeInterval = defaultAggregateByTimeInterval
  }

  return AggregateByTimeArgs
}
