import { AggregateQuery, AggregateQueryField, AggregateResponse, NumberAggregate } from '../interfaces'
import { QueryFieldMap } from './query.helpers'

const convertAggregateQueryFields = <From, To>(
  fieldMap: QueryFieldMap<From, To>,
  fields?: AggregateQueryField<From>[]
): AggregateQueryField<To>[] | undefined => {
  if (!fields) {
    return undefined
  }

  return fields.map(({ field, args }) => {
    const otherKey = fieldMap[field]
    if (!otherKey) {
      throw new Error(`No corresponding field found for '${field as string}' when transforming aggregateQuery`)
    }
    return { field: otherKey, args } as AggregateQueryField<To>
  })
}

const convertAggregateNumberFields = <From, To>(
  fieldMap: QueryFieldMap<From, To>,
  response?: NumberAggregate<From>
): NumberAggregate<To> | undefined => {
  if (!response) {
    return undefined
  }
  return Object.keys(response).reduce((toResponse, fromField) => {
    const otherKey = fieldMap[fromField as keyof From] as keyof To
    if (!otherKey) {
      throw new Error(`No corresponding field found for '${fromField}' when transforming aggregateQuery`)
    }
    return { ...toResponse, [otherKey]: response[fromField as keyof From] }
  }, {} as Record<keyof To, number>)
}

const convertAggregateFields = <From, To>(
  fieldMap: QueryFieldMap<From, To>,
  response?: Partial<From>
): Partial<To> | undefined => {
  if (!response) {
    return undefined
  }
  return Object.keys(response).reduce((toResponse, fromField) => {
    const otherKey = fieldMap[fromField as keyof From] as keyof To
    if (!otherKey) {
      throw new Error(`No corresponding field found for '${fromField}' when transforming aggregateQuery`)
    }
    return { ...toResponse, [otherKey]: response[fromField as keyof From] }
  }, {} as Partial<To>)
}

export const transformAggregateQuery = <From, To>(
  query: AggregateQuery<From>,
  fieldMap: QueryFieldMap<From, To>
): AggregateQuery<To> => ({
  count: convertAggregateQueryFields(fieldMap, query.count),
  sum: convertAggregateQueryFields(fieldMap, query.sum),
  avg: convertAggregateQueryFields(fieldMap, query.avg),
  max: convertAggregateQueryFields(fieldMap, query.max),
  min: convertAggregateQueryFields(fieldMap, query.min)
})

export const transformAggregateResponse = <From, To>(
  response: AggregateResponse<From>,
  fieldMap: QueryFieldMap<From, To>
): AggregateResponse<To> => ({
  count: convertAggregateNumberFields(fieldMap, response.count),
  sum: convertAggregateNumberFields(fieldMap, response.sum),
  avg: convertAggregateNumberFields(fieldMap, response.avg),
  max: convertAggregateFields(fieldMap, response.max),
  min: convertAggregateFields(fieldMap, response.min)
})
