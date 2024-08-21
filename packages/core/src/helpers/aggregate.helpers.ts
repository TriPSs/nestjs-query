import { AggregateFields, AggregateQuery, AggregateResponse, NumberAggregate } from '../interfaces'
import { QueryFieldMap } from './query.helpers'

const convertAggregateQueryFields = <From, To>(
  fieldMap: QueryFieldMap<From, To>,
  fields?: AggregateFields<From>
): AggregateFields<To> | undefined => {
  if (!fields) {
    return undefined
  }

  return fields.map((fromField) => {
    if (typeof fromField === 'string') {
      const otherKey = fieldMap[fromField]
      if (!otherKey) {
        throw new Error(`No corresponding field found for '${fromField}' when transforming aggregateQuery`)
      }
      return otherKey as keyof To
    } else {
      const notFound = Object.keys(fromField).filter((key) => !fieldMap[key as keyof From])
      if (notFound.length)
        throw new Error(`No corresponding field found for '${notFound.join()}' when transforming aggregateQuery`)

      return fromField as { [key in keyof To]: string[] }
    }
  })
}

const convertAggregateNumberFields = <From, To>(
  fieldMap: QueryFieldMap<From, To>,
  response?: NumberAggregate<From>
): NumberAggregate<To> | undefined => {
  if (!response) {
    return undefined
  }
  return Object.keys(response).reduce(
    (toResponse, fromField) => {
      const otherKey = fieldMap[fromField as keyof From] as keyof To
      if (!otherKey) {
        throw new Error(`No corresponding field found for '${fromField}' when transforming aggregateQuery`)
      }
      return { ...toResponse, [otherKey]: response[fromField as keyof From] }
    },
    {} as Record<keyof To, number>
  )
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
  distinctCount: convertAggregateQueryFields(fieldMap, query.distinctCount),
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
  distinctCount: convertAggregateNumberFields(fieldMap, response.distinctCount),
  sum: convertAggregateNumberFields(fieldMap, response.sum),
  avg: convertAggregateNumberFields(fieldMap, response.avg),
  max: convertAggregateFields(fieldMap, response.max),
  min: convertAggregateFields(fieldMap, response.min)
})
