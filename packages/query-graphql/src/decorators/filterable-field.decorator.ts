import { Field, FieldOptions, ReturnTypeFunc } from '@nestjs/graphql'
import { ArrayReflector, Class, FilterComparisonOperators, getPrototypeChain } from '@rezonate/nestjs-query-core'

import { FILTERABLE_FIELD_KEY } from './constants'
import { getRelations } from './relation.decorator'

const reflector = new ArrayReflector(FILTERABLE_FIELD_KEY)
export type FilterableFieldOptions<T = any> = {
  allowedComparisons?: FilterComparisonOperators<unknown>[]
  isJSON?: boolean
  filterRequired?: boolean
  filterOnly?: boolean
} & FieldOptions<T>

export interface FilterableFieldDescriptor<T = any> {
  propertyName: string
  target: Class<unknown>
  returnTypeFunc?: ReturnTypeFunc
  advancedOptions?: FilterableFieldOptions<T>
}

export interface FilterableRelationFields<T = any> extends FilterableFieldDescriptor<T>{
  propertyName: string
  relationPropertyName: string;
}

/**
 * Decorator for Fields that should be filterable through a [[FilterType]]
 *
 * @example
 *
 * In the following DTO `id`, `title` and `completed` are filterable.
 *
 * ```ts
 * import { FilterableField } from '@rezonate/nestjs-query-graphql';
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Object,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<D>
  ): TypedPropertyDescriptor<D> | void => {
    const Ctx = Reflect.getMetadata('design:type', target, propertyName) as Class<unknown>
    reflector.append(target.constructor as Class<unknown>, {
      propertyName: propertyName.toString(),
      target: Ctx,
      returnTypeFunc,
      advancedOptions
    })

    if (advancedOptions?.filterOnly) {
      return undefined
    }

    if (returnTypeFunc) {
      return Field(returnTypeFunc, advancedOptions)(target, propertyName, descriptor)
    }
    if (advancedOptions) {
      return Field(advancedOptions)(target, propertyName, descriptor)
    }
    return Field()(target, propertyName, descriptor)
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

export function getFilterableRelationFields<DTO>(DTOClass: Class<DTO>, realtionTypes:('one' | 'many')[]): FilterableRelationFields[] {
  const relationOpts = getRelations(DTOClass)
  return realtionTypes.flatMap(type => Object.entries(relationOpts[type] ?? {}).flatMap(([relationPropertyName, relation]) => {
    const fields = getFilterableFields(relation.DTO);
    return fields.map(f => ({...f, relationPropertyName}))
  }))
}

export function getFilterableRelationFieldsNames<DTO>(DTOClass: Class<DTO>, DTOFieldsNames: string[], realtionTypes:('one' | 'many')[]) {
  const fields = getFilterableRelationFields(DTOClass, realtionTypes);
  const parentFields = new Set(DTOFieldsNames.map(f => f.toLowerCase()));
  const nonConflictingFields = fields.filter(field => !parentFields.has(`${field.relationPropertyName}${field.propertyName}`.toLowerCase()));
  return nonConflictingFields.map((field) => `${field.relationPropertyName}_${field.propertyName}`);
}