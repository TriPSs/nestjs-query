import { Field, InputType } from '@nestjs/graphql'
import { Class, CommonFieldComparisonType, FilterFieldComparison } from '@rezonate/nestjs-query-core'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { IsUndefined } from '../../validators'

/** @internal */
let jsonFieldComparison: Class<FilterFieldComparison<Record<string, unknown>>>

/** @internal */
export function getOrCreateJSONFieldComparison(): Class<FilterFieldComparison<Record<string, unknown>>> {
  if (jsonFieldComparison) {
    console.log('jsonFieldComparison', jsonFieldComparison)
    return jsonFieldComparison
  }

  @InputType('JsonFieldComparison')
  class JsonFieldComparison implements FilterFieldComparison<Record<string, unknown>> {
    @Field({ nullable: true })
    @IsString()
    @IsUndefined()
    containsLike?: string
  }

  jsonFieldComparison = JsonFieldComparison
  console.log('jsonFieldComparison', jsonFieldComparison)
  return jsonFieldComparison
}
