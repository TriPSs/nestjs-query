import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql'
import { Class, FilterFieldComparison } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsOptional, ValidateNested } from 'class-validator'

import { IsUndefined } from '../../validators'
import { DateFieldComparisonBetween } from './date-field-comparison.type'
import { RelativeDateScalarFuture } from '../../relative-date-future-scalar.type'

/** @internal */
let dateFieldComparison: Class<FilterFieldComparison<Date>>

/** @internal */
export function getOrCreateDateFieldFutureComparison(): Class<FilterFieldComparison<Date>> {
  if (dateFieldComparison) {
    return dateFieldComparison
  }

  @InputType('DateFieldFutureComparison')
  class DateFieldFutureComparison implements FilterFieldComparison<Date> {
    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    is?: boolean | null

    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    isNot?: boolean | null

    @Field(() => RelativeDateScalarFuture, { nullable: true })
    @IsUndefined()
    eq?: Date

    @Field(() => RelativeDateScalarFuture, { nullable: true })
    @IsUndefined()
    neq?: Date

    @Field(() => RelativeDateScalarFuture, { nullable: true })
    @IsUndefined()
    gt?: Date

    @Field(() => RelativeDateScalarFuture, { nullable: true })
    @IsUndefined()
    gte?: Date

    @Field(() => RelativeDateScalarFuture, { nullable: true })
    @IsUndefined()
    lt?: Date

    @Field(() => RelativeDateScalarFuture, { nullable: true })
    @IsUndefined()
    lte?: Date;

    @Field(() => [RelativeDateScalarFuture], { nullable: true })
    @IsUndefined()
    in?: Date[]

    @Field(() => [RelativeDateScalarFuture], { nullable: true })
    @IsUndefined()
    notIn?: Date[]

    @Field(() => DateFieldComparisonBetween, { nullable: true })
    @ValidateNested()
    @Type(() => DateFieldComparisonBetween)
    between?: DateFieldComparisonBetween

    @Field(() => DateFieldComparisonBetween, { nullable: true })
    @ValidateNested()
    @Type(() => DateFieldComparisonBetween)
    notBetween?: DateFieldComparisonBetween
  }

  dateFieldComparison = DateFieldFutureComparison

  return dateFieldComparison
}
