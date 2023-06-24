import {
  ASTNode,
  DirectiveNode,
  FieldNode,
  getArgumentValues,
  getNamedType,
  GraphQLField,
  GraphQLUnionType,
  isCompositeType,
  Kind
} from 'graphql'

import type { CursorConnectionType, OffsetConnectionType } from '../types'
import type { RelationDescriptor } from './relation.decorator'
import type { Query, SelectRelation } from '@ptc-org/nestjs-query-core'
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
  if (fieldNode.kind === Kind.FIELD) {
    if (!(parentType instanceof GraphQLUnionType)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return parentType.getFields()[fieldNode.name.value]
    } else {
      // XXX: TODO: Handle GraphQLUnionType
    }
  }
  return undefined
}

function getDirectiveValue(directive: DirectiveNode, info: ResolveInfo) {
  const arg = directive.arguments[0] // only arg on an include or skip directive is "if"
  if (arg.value.kind !== Kind.VARIABLE) {
    // eslint-disable-next-line
    return !!arg.value['value']
  }
  return info.variableValues[arg.value.name.value]
}

function getDirectiveResults(fieldNode: FieldNode, info: ResolveInfo) {
  const directiveResult = {
    shouldInclude: true,
    shouldSkip: false
  }

  return fieldNode.directives.reduce((result, directive) => {
    switch (directive.name.value) {
      case 'include':
        return { ...result, shouldInclude: getDirectiveValue(directive, info) }
      case 'skip':
        return { ...result, shouldSkip: getDirectiveValue(directive, info) }
      default:
        return result
    }
  }, directiveResult)
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

    if (fieldNode.directives && fieldNode.directives.length) {
      const { shouldInclude, shouldSkip } = getDirectiveResults(fieldNode, resolveInfo)
      // field/fragment is not included if either the @skip condition is true or the @include condition is false
      // https://facebook.github.io/graphql/draft/#sec--include
      if (shouldSkip || !shouldInclude) {
        return tree
      }
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

export function createLookAheadInfo<DTO>(
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
