import { ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import type { Class, QueryResolveTree, SelectRelation } from '@ptc-org/nestjs-query-core'
import type { GraphQLResolveInfo as ResolveInfo } from 'graphql'

import { createGqlParamDecorator } from './gql-param.decorator'
import { createLookAheadInfo, simplifyResolveInfo } from './graphql-resolve-info.utils'
import { getRelationsDescriptors } from './relation.decorator'

export interface GraphQLResolveInfoResult<InfoDTO, RelationsDTO = InfoDTO> {
  /**
   * @internal this implementation is not final and subjected to change! Use at own risk!
   */
  info?: QueryResolveTree<InfoDTO>
  /**
   * @internal this implementation is not final and subjected to change! Use at own risk!
   */
  relations?: SelectRelation<RelationsDTO>[]
}

/**
 * @internal this implementation is not final and subjected to change! Use at own risk!
 */
export const GraphQLResultInfo = <DTO>(DTOClass: Class<DTO>): ParameterDecorator => {
  // Get all relations that have look ahead enabled
  const relations = getRelationsDescriptors(DTOClass).filter(
    (relation) => relation.relationOpts.enableLookAhead && !relation.isMany
  )

  return createGqlParamDecorator((data: unknown, ctx: ExecutionContext): GraphQLResolveInfoResult<DTO> => {
    const info = GqlExecutionContext.create(ctx).getInfo<ResolveInfo>()
    const simplifiedInfo = simplifyResolveInfo<DTO>(info)

    return {
      info: simplifiedInfo,
      relations: relations.length === 0 ? [] : createLookAheadInfo<DTO>(relations, simplifiedInfo)
    }
  })()
}
