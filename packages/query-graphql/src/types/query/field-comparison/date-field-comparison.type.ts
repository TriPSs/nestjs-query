import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql'
import { Class, FilterFieldComparison } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsOptional, ValidateNested } from 'class-validator'

import { IsUndefined } from '../../validators'
import { RelativeDateScalar } from '../../relative-date-scalar.type'

/** @internal */
let dateFieldComparison: Class<FilterFieldComparison<Date>>

/** @internal */
export function getOrCreateDateFieldComparison(): Class<FilterFieldComparison<Date>> {
  if (dateFieldComparison) {
    return dateFieldComparison
  }

  @InputType()
  class DateFieldComparisonBetween {
    @Field(() => GraphQLISODateTime, { nullable: false })
    @IsDate()
    lower!: Date

    @Field(() => GraphQLISODateTime, { nullable: false })
    @IsDate()
    upper!: Date
  }

  @InputType('DateFieldComparison')
  class DateFieldComparison implements FilterFieldComparison<Date> {
    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    is?: boolean | null

    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    isNot?: boolean | null

    @Field(() => RelativeDateScalar, { nullable: true })
    @IsUndefined()
    eq?: Date

    @Field(() => RelativeDateScalar, { nullable: true })
    @IsUndefined()
    neq?: Date

    @Field(() => RelativeDateScalar, { nullable: true })
    @IsUndefined()
    gt?: Date

    @Field(() => RelativeDateScalar, { nullable: true })
    @IsUndefined()
    gte?: Date

    @Field(() => RelativeDateScalar, { nullable: true })
    @IsUndefined()
    lt?: Date

    @Field(() => RelativeDateScalar, { nullable: true })
    @IsUndefined()
    lte?: Date;

    @Field(() => [RelativeDateScalar], { nullable: true })
    @IsUndefined()
    in?: Date[]

    @Field(() => [RelativeDateScalar], { nullable: true })
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

  dateFieldComparison = DateFieldComparison

  return dateFieldComparison
}
