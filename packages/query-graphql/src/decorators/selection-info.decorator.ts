import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import type { Class, Selection } from '@ptc-org/nestjs-query-core'
import type { GraphQLCompositeType, GraphQLResolveInfo as ResolveInfo } from 'graphql'

import { convertToSelectionInfo } from './graphql-resolve-info.utils'

export const SelectionInfo = <DTO>(
  DTOClass: Class<DTO>,
  isCnxTypeFn = (t: GraphQLCompositeType) => t.name.includes('Connection')
): ParameterDecorator => {
  return createParamDecorator((data: unknown, ctx: ExecutionContext): Selection<typeof DTOClass> => {
    const info = GqlExecutionContext.create(ctx).getInfo<ResolveInfo>()
    return convertToSelectionInfo<typeof DTOClass>(info, isCnxTypeFn)
  })()
}
