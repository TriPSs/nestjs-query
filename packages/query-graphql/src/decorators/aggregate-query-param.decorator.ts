import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { GraphQLResolveInfo } from 'graphql'

import type { AggregateQuery, QueryResolveTree } from '@ptc-org/nestjs-query-core'

import { removePagingFromSimplifiedInfo, simplifyResolveInfo } from './graphql-resolve-info.utils'

const QUERY_OPERATORS: (keyof AggregateQuery<unknown>)[] = ['groupBy', 'count', 'avg', 'sum', 'min', 'max']

export const AggregateQueryParam = createParamDecorator(<DTO>(data: unknown, ctx: ExecutionContext) => {
  const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>()
  const simpleResolverInfo = removePagingFromSimplifiedInfo(simplifyResolveInfo<DTO>(info))

  return QUERY_OPERATORS.reduce((query, operator) => {
    const simpleOperator = (simpleResolverInfo.fields as Record<string, QueryResolveTree<DTO> | undefined>)[operator]
    if (simpleOperator) {
      const operatorFields = Object.values(simpleOperator.fields) as QueryResolveTree<unknown>[]
      if (operatorFields.length > 0) {
        return {
          ...query,
          [operator]: operatorFields.map((field) => ({ field: field.name, args: field.args }))
        }
      }
    }

    return query
  }, {} as AggregateQuery<DTO>)
})
