import { Field, InputType } from '@nestjs/graphql';
import { Class, FilterFieldComparison } from '@rezonate/nestjs-query-core';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsUndefined } from '../../validators';

/** @internal */
let jsonFieldComparison: Class<FilterFieldComparison<Record<string, unknown>>>;

/** @internal */
export function getOrCreateJSONFieldComparison(): Class<FilterFieldComparison<Record<string, unknown>>> {
  if (jsonFieldComparison) {
    return jsonFieldComparison;
  }

  @InputType('JsonFieldComparison')
  class JsonFieldComparison implements FilterFieldComparison<Record<string, unknown>> {
    @Field({ nullable: true })
    @IsString()
    @IsUndefined()
    containsLike?: string;

    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    is?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    isNot?: boolean | null;
  }

  jsonFieldComparison = JsonFieldComparison;
  return jsonFieldComparison;
}
