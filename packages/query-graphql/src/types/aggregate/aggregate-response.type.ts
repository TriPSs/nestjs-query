import { Directive, Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { AggregateResponse, Class, MapReflector, NumberAggregate, TypeAggregate } from '@rezonate/nestjs-query-core'
import { GraphQLScalarType } from 'graphql'

import { getGraphqlObjectName } from '../../common'
import { FilterableFieldDescriptor, getFilterableFields, getShareableDTO, setShareable, SkipIf } from '../../decorators'
import { getRelatedDTOsMap } from '../../decorators/filterable-field.decorator'

const memoMap = new Map<string, unknown>()
const getAggregatedType = <Fn extends (...args: unknown[]) => unknown>(name: string, createFn: Fn): ReturnType<Fn> => {
  if (memoMap.has(name)) return memoMap.get(name) as ReturnType<Fn>

  const result = createFn()
  memoMap.set(name, result)
  return result as ReturnType<Fn>
}

const reflector = new MapReflector('nestjs-query:aggregate-response-type')

const NumberAggregatedType = <DTO>(
  name: string,
  fields: FilterableFieldDescriptor[],
  NumberType: GraphQLScalarType,
  relationFields: ReturnType<typeof getRelatedDTOsMap> = new Map()
): Class<NumberAggregate<DTO>> => {
  const fieldNames = fields.map((f) => f.propertyName)

  const Aggregated = getAggregatedType(name, () => {
    @ObjectType(name)
    @Directive('@shareable')
    class AggregatedClass {
    }

    return AggregatedClass
  })

  fieldNames.forEach((propertyName) => {
    Field(() => NumberType, { nullable: true })(Aggregated.prototype, propertyName)
  })

  relationFields.forEach((related, key) => {
    const objName = getGraphqlObjectName(related.DTO, 'Unable to make AggregationResponseType.')
    const rFields = getFilterableFields(related.DTO)
    const rt = NumberAggregatedType(objName + 'Aggregate', rFields, NumberType)
    Field(() => rt, { nullable: true })(Aggregated.prototype, key)
  })

  return Aggregated
}

const AggregateGroupByType = (
  name: string,
  fields: FilterableFieldDescriptor[],
  relationFields: ReturnType<typeof getRelatedDTOsMap> = new Map()
) => {
  const Aggregated = getAggregatedType(name, () => {
    @ObjectType(name)
    @Directive('@shareable')
    class AggregatedClass {
    }

    return AggregatedClass
  })

  fields.forEach(({ propertyName, target, returnTypeFunc }) => {
    let rt = returnTypeFunc ? returnTypeFunc() : target
    if (Array.isArray(rt)) rt = rt[0]
    Field(() => rt, { nullable: true })(Aggregated.prototype, propertyName)
  })

  relationFields.forEach((related, key) => {
    const objName = getGraphqlObjectName(related.DTO, 'Unable to make AggregationResponseType.')
    const rFields = getFilterableFields(related.DTO)
    const rt = AggregateGroupByType(objName + 'GroupByAggregate', rFields)
    Field(() => rt, { nullable: true })(Aggregated.prototype, key)
  })

  return Aggregated
}

const AggregatedType = <DTO>(
  name: string,
  fields: FilterableFieldDescriptor[],
  relationFields: ReturnType<typeof getRelatedDTOsMap> = new Map()
): Class<TypeAggregate<DTO>> => {
  const Aggregated = getAggregatedType(name, () => {
    @ObjectType(name)
    @Directive('@shareable')
    class AggregatedClass {
    }

    return AggregatedClass
  })

  fields.forEach(({ propertyName, target, returnTypeFunc }) => {
    const rt = returnTypeFunc ? returnTypeFunc() : target
    Field(() => rt, { nullable: true })(Aggregated.prototype, propertyName)
  })

  relationFields.forEach((related, key) => {
    const objName = getGraphqlObjectName(related.DTO, 'Unable to make AggregationResponseType.')
    const rFields = getFilterableFields(related.DTO)
    const rt = AggregatedType(objName + 'MinMaxAggregate', rFields)
    Field(() => rt, { nullable: true })(Aggregated.prototype, key)
  })

  return Aggregated
}

export type AggregateResponseOpts = { prefix: string }

export function AggregateResponseType<DTO>(DTOClass: Class<DTO>, opts?: AggregateResponseOpts): Class<AggregateResponse<DTO>> {
  const objName = getGraphqlObjectName(DTOClass, 'Unable to make AggregationResponseType.')
  const prefix = opts?.prefix ?? objName
  const isShareable = getShareableDTO(DTOClass)

  const aggName = `${prefix}AggregateResponse`
  return reflector.memoize(DTOClass, aggName, () => {
    const fields = getFilterableFields(DTOClass)
    const relatedDTOs = getRelatedDTOsMap(DTOClass)
    if (!fields.length && !relatedDTOs.size) {
      throw new Error(
        `No fields found to create AggregationResponseType for ${DTOClass.name}. Ensure fields are annotated with @FilterableField`
      )
    }

    const numberFields = fields.filter(({ target }) => target === Number)
    const minMaxFields = fields.filter(({ target }) => target !== Boolean)
    const GroupType = AggregateGroupByType(`${prefix}AggregateGroupBy`, fields, relatedDTOs)
    const CountType = NumberAggregatedType(`${prefix}CountAggregate`, fields, Int, relatedDTOs)
    const FloatType = NumberAggregatedType(`${prefix}FloatAggregate`, numberFields, Float, relatedDTOs)
    const MinMaxType = AggregatedType(`${prefix}MinMaxAggregate`, minMaxFields, relatedDTOs)

    @ObjectType(aggName)
    class AggResponse {
      @Field(() => GroupType, { nullable: true })
      groupBy?: Partial<DTO>

      @Field(() => CountType, { nullable: true })
      count?: NumberAggregate<DTO>

      @Field(() => CountType, { nullable: true })
      distinctCount?: NumberAggregate<DTO>

      @SkipIf(() => numberFields.length === 0, Field(() => FloatType, { nullable: true }))
      sum?: NumberAggregate<DTO>

      @SkipIf(() => numberFields.length === 0, Field(() => FloatType, { nullable: true }))
      avg?: NumberAggregate<DTO>

      @SkipIf(() => minMaxFields.length === 0, Field(() => MinMaxType, { nullable: true }))
      min?: TypeAggregate<DTO>

      @SkipIf(() => minMaxFields.length === 0, Field(() => MinMaxType, { nullable: true }))
      max?: TypeAggregate<DTO>
    }

    if(isShareable) {
      setShareable(AggResponse)
      setShareable(GroupType)
      setShareable(CountType)
      setShareable(FloatType)
      setShareable(MinMaxType)
    }

    return AggResponse
  })
}
