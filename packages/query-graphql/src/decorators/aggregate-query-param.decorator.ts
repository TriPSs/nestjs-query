import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { GraphQLResolveInfo } from 'graphql'

import type { AggregateQuery, QueryResolveTree } from '@souagrosolucoes/nestjs-query-core'

import { removePagingFromSimplifiedInfo, simplifyResolveInfo } from './graphql-resolve-info.utils'

const QUERY_OPERATORS: (keyof AggregateQuery<unknown>)[] = ['groupBy', 'count', 'avg', 'sum', 'min', 'max']

export const AggregateQueryParam = createParamDecorator(<DTO>(data: unknown, ctx: ExecutionContext) => {
  const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>()
  const simpleResolverInfo = removePagingFromSimplifiedInfo(simplifyResolveInfo<DTO>(info))

  return QUERY_OPERATORS.reduce((query, operator) => {
    if (simpleResolverInfo.fields[operator]) {
      const simpleOperator = simpleResolverInfo.fields[operator] as QueryResolveTree<DTO> | undefined
      const operatorFields = Object.keys(simpleOperator.fields || {})

      if (operatorFields && operatorFields.length > 0) {
        return {
          ...query,
          [operator]: operatorFields.map((operatorField) => ({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            field: simpleOperator.fields[operatorField].name,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            args: simpleOperator.fields[operatorField].args
          }))
        }
      }
    }

    return query
  }, {} as AggregateQuery<DTO>)
})
