import { applyDecorators } from '@nestjs/common'
import { ArrayReflector, Class, getPrototypeChain } from '@ptc-org/nestjs-query-core'

import { ReturnTypeFunc, ReturnTypeFuncValue } from '../interfaces/return-type-func'
import { FILTERABLE_FIELD_KEY } from './constants'
import { Field, FieldOptions } from './field.decorator'

const reflector = new ArrayReflector(FILTERABLE_FIELD_KEY)
export type FilterableFieldOptions = {
  allowedComparisons?: ['=', '!=']
  filterRequired?: boolean
  filterOnly?: boolean
  filterDecorators?: PropertyDecorator[]
} & FieldOptions

export interface FilterableFieldDescriptor {
  propertyName: string
  schemaName: string
  target: Class<unknown>
  returnTypeFunc?: ReturnTypeFunc<ReturnTypeFuncValue>
  advancedOptions?: FilterableFieldOptions
}

export function filterableFieldOptionsToField(advancedOptions: FilterableFieldOptions): FieldOptions {
  // Remove fields that are not needed in the Field decorator
  const { filterRequired, filterDecorators, filterOnly, ...fieldOptions } = advancedOptions

  return fieldOptions
}

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
export function FilterableField(): PropertyDecorator & MethodDecorator
export function FilterableField(options: FilterableFieldOptions): PropertyDecorator & MethodDecorator
export function FilterableField(
  returnTypeFunction?: ReturnTypeFunc,
  options?: FilterableFieldOptions
): PropertyDecorator & MethodDecorator
export function FilterableField(
  returnTypeFuncOrOptions?: ReturnTypeFunc | FilterableFieldOptions,
  maybeOptions?: FilterableFieldOptions
): MethodDecorator | PropertyDecorator {
  let returnTypeFunc: ReturnTypeFunc | undefined
  let advancedOptions: FilterableFieldOptions | undefined
  if (typeof returnTypeFuncOrOptions === 'function') {
    returnTypeFunc = returnTypeFuncOrOptions
    advancedOptions = maybeOptions
  } else if (typeof returnTypeFuncOrOptions === 'object') {
    advancedOptions = returnTypeFuncOrOptions
  } else if (typeof maybeOptions === 'object') {
    advancedOptions = maybeOptions
  }
  return <D>(
    target: object,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<D>
  ): TypedPropertyDescriptor<D> | void => {
    const Ctx = Reflect.getMetadata('design:type', target, propertyName) as Class<unknown>
    reflector.append(target.constructor as Class<unknown>, {
      propertyName: propertyName.toString(),
      schemaName: propertyName.toString(),
      target: Ctx,
      returnTypeFunc,
      advancedOptions
    })

    if (advancedOptions?.filterOnly) {
      return undefined
    }

    applyDecorators(Field(() => returnTypeFunc, filterableFieldOptionsToField(advancedOptions)))(target, propertyName, descriptor)
  }
}

export function getFilterableFields<DTO>(DTOClass: Class<DTO>): FilterableFieldDescriptor[] {
  return getPrototypeChain(DTOClass).reduce((fields, Cls) => {
    const existingFieldNames = fields.map((t) => t.propertyName)
    const typeFields = reflector.get<unknown, FilterableFieldDescriptor>(Cls) ?? []
    const newFields = typeFields.filter((t) => !existingFieldNames.includes(t.propertyName))
    return [...newFields, ...fields]
  }, [] as FilterableFieldDescriptor[])
}
