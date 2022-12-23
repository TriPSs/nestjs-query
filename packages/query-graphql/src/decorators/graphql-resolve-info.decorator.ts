import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import type { GraphQLResolveInfo as ResolveInfo } from 'graphql'

import { QueryResolveTree, simplifyResolveInfo } from './graphql-resolve-info.utils'

export function GraphQLResolveInfo<DTO>(simplify = true): ParameterDecorator {
  return createParamDecorator((data: unknown, ctx: ExecutionContext): QueryResolveTree<DTO> | ResolveInfo => {
    const resolveInfo = GqlExecutionContext.create(ctx).getInfo<ResolveInfo>()

    if (simplify) {
      return simplifyResolveInfo<DTO>(resolveInfo)
    }

    return resolveInfo
  })()
}
