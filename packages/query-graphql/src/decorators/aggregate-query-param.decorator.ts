import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AggregateFields, AggregateQuery } from '@rezonate/nestjs-query-core'
import { GraphQLResolveInfo } from 'graphql'
import graphqlFields from 'graphql-fields'

export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

const EXCLUDED_FIELDS = ['__typename']
const QUERY_OPERATORS: (keyof AggregateQuery<unknown>)[] = ['groupBy', 'count', 'distinctCount', 'avg', 'sum', 'min', 'max']
export const AggregateQueryParam = createParamDecorator(<DTO>(data: unknown, ctx: ExecutionContext) => {
  const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  const fields = graphqlFields(info as any, {}, { excludedFields: EXCLUDED_FIELDS }) as Record<
    keyof AggregateQuery<DTO>,
    Record<keyof DTO, unknown>
  >
  return QUERY_OPERATORS.filter((operator) => !!fields[operator]).reduce((query, operator) => {
    const queryFields = Object.entries(fields[operator]) as Entries<DTO>
    const queryFieldsWithRelations: AggregateFields<DTO> = queryFields.map(([key, value]) => {
      const relations = Object.keys(value)
      if (relations.length)
        return {
          [key]: relations
        } as { [key in keyof DTO]: string[] }
      return key
    })
    if (queryFieldsWithRelations.length) {
      return { ...query, [operator]: queryFieldsWithRelations }
    }
    return query
  }, {} as AggregateQuery<DTO>)
})
