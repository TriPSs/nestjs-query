import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import type { Class, SelectRelation } from '@ptc-org/nestjs-query-core'
import type { GraphQLResolveInfo as ResolveInfo } from 'graphql'

import { QueryResolveTree, simplifyResolveInfo } from './graphql-resolve-info.utils'
import { getRelationsDescriptors, RelationDescriptor } from './relation.decorator'

function createLookAheadInfo<DTO>(
  relations: RelationDescriptor<unknown>[],
  simpleResolveInfo: QueryResolveTree<DTO>
): SelectRelation<DTO>[] {
  return relations
    .map((relation): SelectRelation<DTO> | boolean => {
      if (relation.name in simpleResolveInfo.fields) {
        return {
          name: relation.name,
          query: (simpleResolveInfo.fields[relation.name] as QueryResolveTree<DTO>).args || {}
        }
      }

      return false
    })
    .filter(Boolean) as SelectRelation<DTO>[]
}

export const GraphQLLookAheadRelations = <DTO>(DTOClass: Class<DTO>): ParameterDecorator => {
  // Get all relations that have look ahead enabled
  const relations = getRelationsDescriptors(DTOClass).filter(
    (relation) => relation.relationOpts.enableLookAhead && !relation.isMany
  )

  if (relations.length === 0) {
    return () => []
  }

  return createParamDecorator((data: unknown, ctx: ExecutionContext): SelectRelation<DTO>[] => {
    const info = GqlExecutionContext.create(ctx).getInfo<ResolveInfo>()
    return createLookAheadInfo<DTO>(relations, simplifyResolveInfo(info))
  })()
}
