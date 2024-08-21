import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { AggregateResponse, Class, MapReflector, NumberAggregate, TypeAggregate } from '@rezonate/nestjs-query-core'
import { GraphQLScalarType } from 'graphql'

import { getGraphqlObjectName } from '../../common'
import { FilterableFieldDescriptor, getFilterableFields, SkipIf } from '../../decorators'
import { FilterableRelationFields, getFilterableRelationFields } from '../../decorators/filterable-field.decorator'

function memoize<Res, Fn extends (...args:unknown[]) => Res>(fn: Fn) {
  const memoMap = new Map<string, Res>();
  return function (...args:unknown[]) {
    const key = String(args[0])
    if (memoMap.has(key)) return memoMap.get(key)!;

    const result = fn.call({}, ...args);
    memoMap.set(key, result);
    return result;
  };
}

const reflector = new MapReflector('nestjs-query:aggregate-response-type')

const capitalize = (key: string) => key.slice(0, 1).toUpperCase() + key.slice(1)

function NumberAggregatedType<DTO>(
  name: string,
  fields: FilterableFieldDescriptor[],
  NumberType: GraphQLScalarType,
  relationFields: Map<string, FilterableRelationFields[]> = new Map()
): Class<NumberAggregate<DTO>> {
  const fieldNames = fields.map((f) => f.propertyName)

  @ObjectType(name)
  class Aggregated {
  }

  fieldNames.forEach((propertyName) => {
    Field(() => NumberType, { nullable: true })(Aggregated.prototype, propertyName)
  })

  relationFields.forEach((related, key) => {
    const rt = memoizedNumberAggregatedType(capitalize(key)+ 'Relation' + name, related, NumberType)
    Field(() => rt, { nullable: true })(Aggregated.prototype, key)
  })

  return Aggregated
}

const memoizedNumberAggregatedType = memoize(<DTO>(name: string,fields: FilterableFieldDescriptor[], NumberType: GraphQLScalarType,) => NumberAggregatedType<DTO>(name, fields, NumberType));


function AggregateGroupByType<DTO>(
  name: string,
  fields: FilterableFieldDescriptor[],
  relationFields: Map<string, FilterableRelationFields[]> = new Map()
): Class<TypeAggregate<DTO>> {
  @ObjectType(name)
  class Aggregated {
  }

  fields.forEach(({ propertyName, target, returnTypeFunc }) => {
    const rt = returnTypeFunc ? returnTypeFunc() : target
    Field(() => rt, { nullable: true })(Aggregated.prototype, propertyName)
  })

  relationFields.forEach((related, key) => {
    const rt = memoizedAggregateGroupByType(capitalize(key) + 'Relation' + name, related)
    Field(() => rt, { nullable: true })(Aggregated.prototype, key)
  })

  return Aggregated
}

const memoizedAggregateGroupByType = memoize(<DTO>(name: string,fields: FilterableFieldDescriptor[]) => AggregateGroupByType<DTO>(name, fields));

function AggregatedType<DTO>(
  name: string,
  fields: FilterableFieldDescriptor[],
  relationFields: Map<string, FilterableRelationFields[]> = new Map()
): Class<TypeAggregate<DTO>> {
  @ObjectType(name)
  class Aggregated {
  }

  fields.forEach(({ propertyName, target, returnTypeFunc }) => {
    const rt = returnTypeFunc ? returnTypeFunc() : target
    Field(() => rt, { nullable: true })(Aggregated.prototype, propertyName)
  })

  relationFields.forEach((related, key) => {
    const rt = memoizedAggregatedType(capitalize(key)+ 'Relation' + name, related)
    Field(() => rt, { nullable: true })(Aggregated.prototype, key)
  })

  return Aggregated
}

const memoizedAggregatedType = memoize(<DTO>(name: string,fields: FilterableFieldDescriptor[]) => AggregatedType<DTO>(name, fields));

export type AggregateResponseOpts = { prefix: string }

export function AggregateResponseType<DTO>(DTOClass: Class<DTO>, opts?: AggregateResponseOpts): Class<AggregateResponse<DTO>> {
  const objName = getGraphqlObjectName(DTOClass, 'Unable to make AggregationResponseType.')
  const prefix = opts?.prefix ?? objName
  const aggName = `${prefix}AggregateResponse`
  return reflector.memoize(DTOClass, aggName, () => {
    const fields = getFilterableFields(DTOClass)
    const relationFields = getFilterableRelationFields(DTOClass, ['one', 'many'])
    if (!fields.length && !relationFields.length) {
      throw new Error(
        `No fields found to create AggregationResponseType for ${DTOClass.name}. Ensure fields are annotated with @FilterableField`
      )
    }

    const groupedRelationFields = relationFields.reduce((map, field) => {
      map.set(field.relationPropertyName, [...(map.get(field.relationPropertyName) ?? []), field])
      return map
    }, new Map<string, FilterableRelationFields[]>())

    const numberFields = fields.filter(({ target }) => target === Number)
    const minMaxFields = fields.filter(({ target }) => target !== Boolean)
    const GroupType = AggregateGroupByType(`${prefix}AggregateGroupBy`, fields, groupedRelationFields)
    const CountType = NumberAggregatedType(`${prefix}CountAggregate`, fields, Int, groupedRelationFields)
    const DistinctCountType = NumberAggregatedType(`${prefix}DistinctCountAggregate`, fields, Int, groupedRelationFields)
    const SumType = NumberAggregatedType(`${prefix}SumAggregate`, numberFields, Float, groupedRelationFields)
    const AvgType = NumberAggregatedType(`${prefix}AvgAggregate`, numberFields, Float, groupedRelationFields)
    const MinType = AggregatedType(`${prefix}MinAggregate`, minMaxFields, groupedRelationFields)
    const MaxType = AggregatedType(`${prefix}MaxAggregate`, minMaxFields, groupedRelationFields)

    @ObjectType(aggName)
    class AggResponse {
      @Field(() => GroupType, { nullable: true })
      groupBy?: Partial<DTO>

      @Field(() => CountType, { nullable: true })
      count?: NumberAggregate<DTO>

      @Field(() => DistinctCountType, { nullable: true })
      distinctCount?: NumberAggregate<DTO>

      @SkipIf(() => numberFields.length === 0, Field(() => SumType, { nullable: true }))
      sum?: NumberAggregate<DTO>

      @SkipIf(() => numberFields.length === 0, Field(() => AvgType, { nullable: true }))
      avg?: NumberAggregate<DTO>

      @SkipIf(() => minMaxFields.length === 0, Field(() => MinType, { nullable: true }))
      min?: TypeAggregate<DTO>

      @SkipIf(() => minMaxFields.length === 0, Field(() => MaxType, { nullable: true }))
      max?: TypeAggregate<DTO>
    }

    return AggResponse
  })
}
