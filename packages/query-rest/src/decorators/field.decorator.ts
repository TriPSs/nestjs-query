import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsOptional } from 'class-validator'

import { ReturnTypeFunc } from '../interfaces/return-type-func'

export type FieldOptions = Omit<ApiPropertyOptions, 'type' | 'isArray'>

/**
 * Decorator for Fields that should be filterable through a [[FilterType]]
 *
 * @example
 *
 * In the following DTO `id`, `title` and `completed` are filterable.
 *
 * ```ts
 * import { FilterableField } from '@ptc-org/nestjs-query-graphql';
 * import { ObjectType, ID, GraphQLISODateTime, Field } from '@nestjs/graphql';
 *
 * @ObjectType('TodoItem')
 * export class TodoItemDTO {
 *   @FilterableField(() => ID)
 *   id!: string;
 *
 *   @FilterableField()
 *   title!: string;
 *
 *   @FilterableField()
 *   completed!: boolean;
 *
 *   @Field(() => GraphQLISODateTime)
 *   created!: Date;
 *
 *   @Field(() => GraphQLISODateTime)
 *   updated!: Date;
 * }
 * ```
 */
export function Field(): PropertyDecorator & MethodDecorator
export function Field(options: FieldOptions): PropertyDecorator & MethodDecorator
export function Field(returnTypeFunction?: ReturnTypeFunc, options?: FieldOptions): PropertyDecorator & MethodDecorator
export function Field(
  returnTypeFuncOrOptions?: ReturnTypeFunc | FieldOptions,
  maybeOptions?: FieldOptions
): MethodDecorator | PropertyDecorator {
  let returnTypeFunc: ReturnTypeFunc | undefined
  let advancedOptions: FieldOptions | undefined
  if (typeof returnTypeFuncOrOptions === 'function') {
    returnTypeFunc = returnTypeFuncOrOptions
    advancedOptions = maybeOptions
  } else if (typeof returnTypeFuncOrOptions === 'object') {
    advancedOptions = returnTypeFuncOrOptions
  } else if (typeof maybeOptions === 'object') {
    advancedOptions = maybeOptions
  }

  const returnedType = returnTypeFunc?.()
  const isArray = returnedType && Array.isArray(returnedType)
  const type = (isArray ? returnedType[0] : returnedType) as never

  if (
    advancedOptions !== undefined &&
    advancedOptions.required === undefined &&
    (advancedOptions.nullable || advancedOptions.default !== undefined)
  ) {
    advancedOptions.required = false
  }

  const decorators = [
    Expose(),
    ApiProperty({
      type,
      isArray,
      ...advancedOptions
    })
  ]

  if (advancedOptions !== undefined && advancedOptions.required !== undefined) {
    if (advancedOptions.required) {
      decorators.push(IsNotEmpty())
    } else {
      decorators.push(IsOptional())
    }
  }

  if (type) {
    decorators.push(Type(() => type))
  }

  return applyDecorators(...decorators)
}
