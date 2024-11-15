import { Field, InputType } from '@nestjs/graphql'
import { Class, FilterFieldComparison } from '@souagrosolucoes/nestjs-query-core'
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator'

import { IsUndefined } from '../../validators'

/** @internal */
let jsonFieldComparison: Class<FilterFieldComparison<string>>

/** @internal */
export function getOrCreateJsonFieldComparison(): Class<FilterFieldComparison<string>> {
  if (jsonFieldComparison) {
    return jsonFieldComparison
  }

  @InputType()
  class JsonFieldComparison implements FilterFieldComparison<string> {
    @Field({ nullable: true })
    @IsObject()
    @IsUndefined()
    contains?: object
  }

  jsonFieldComparison = JsonFieldComparison
  return jsonFieldComparison
}
