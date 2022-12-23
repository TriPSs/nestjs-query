import { ASTNode, FieldNode, getArgumentValues, getNamedType, GraphQLField, GraphQLUnionType, isCompositeType } from 'graphql'

import type { CursorConnectionType, OffsetConnectionType } from '../types'
import type { Query } from '@ptc-org/nestjs-query-core'
import type { GraphQLCompositeType, GraphQLResolveInfo as ResolveInfo, SelectionNode } from 'graphql'

type QueryResolveFields<DTO> = {
  [key in keyof DTO]: QueryResolveTree<
    // If the key is a array get the type of the array
    DTO[key] extends ArrayLike<unknown> ? DTO[key][number] : DTO[key]
  >
}

export interface QueryResolveTree<DTO> {
  name: string
  alias: string
  args?: Query<DTO>
  fields: QueryResolveFields<DTO>
}

function getFieldFromAST<TContext>(
  fieldNode: ASTNode,
  parentType: GraphQLCompositeType
): GraphQLField<GraphQLCompositeType, TContext> | undefined {
  if (fieldNode.kind === 'Field') {
    if (!(parentType instanceof GraphQLUnionType)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return parentType.getFields()[fieldNode.name.value]
    } else {
      // XXX: TODO: Handle GraphQLUnionType
    }
  }
  return undefined
}

function parseFieldNodes<DTO>(
  inASTs: ReadonlyArray<SelectionNode> | SelectionNode,
  resolveInfo: ResolveInfo,
  initTree: QueryResolveFields<DTO> | null,
  parentType: GraphQLCompositeType
): QueryResolveTree<DTO> | QueryResolveFields<DTO> {
  const asts: ReadonlyArray<FieldNode> = Array.isArray(inASTs) ? inASTs : [inASTs]

  return asts.reduce((tree, fieldNode) => {
    const alias: string = fieldNode?.alias?.value ?? fieldNode.name.value

    const field = getFieldFromAST(fieldNode, parentType)
    if (field == null) {
      return tree
    }
    const fieldGqlTypeOrUndefined = getNamedType(field.type)
    if (!fieldGqlTypeOrUndefined) {
      return tree
    }

    const parsedField = {
      name: fieldNode.name.value,
      alias,
      args: getArgumentValues(field, fieldNode, resolveInfo.variableValues),

      fields:
        fieldNode.selectionSet && isCompositeType(fieldGqlTypeOrUndefined)
          ? parseFieldNodes(
              fieldNode.selectionSet.selections,
              resolveInfo,
              {} as QueryResolveFields<DTO>,
              fieldGqlTypeOrUndefined
            )
          : {}
    } as QueryResolveTree<DTO>

    if (tree === null) {
      return parsedField
    } else {
      tree[alias] = parsedField
    }

    return tree
  }, initTree)
}

function isOffsetPaging<DTO>(info: unknown): info is QueryResolveTree<OffsetConnectionType<DTO>> {
  return typeof (info as QueryResolveTree<OffsetConnectionType<DTO>>).fields.nodes !== 'undefined'
}

function isCursorPaging<DTO>(info: unknown): info is QueryResolveTree<CursorConnectionType<DTO>> {
  return typeof (info as QueryResolveTree<CursorConnectionType<DTO>>).fields.edges !== 'undefined'
}

export function simplifyResolveInfo<DTO>(resolveInfo: ResolveInfo): QueryResolveTree<DTO> {
  const simpleInfo = parseFieldNodes(resolveInfo.fieldNodes, resolveInfo, null, resolveInfo.parentType) as
    | QueryResolveTree<DTO>
    | QueryResolveTree<OffsetConnectionType<DTO>>
    | QueryResolveTree<CursorConnectionType<DTO>>

  if (isOffsetPaging(simpleInfo)) {
    return simpleInfo.fields.nodes as QueryResolveTree<DTO>
  } else if (isCursorPaging(simpleInfo)) {
    return simpleInfo.fields.edges.fields.node as QueryResolveTree<DTO>
  }

  return simpleInfo as QueryResolveTree<DTO>
}
