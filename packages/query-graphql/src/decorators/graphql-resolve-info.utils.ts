import {
  ASTNode,
  DirectiveNode,
  getArgumentValues,
  getNamedType,
  GraphQLField,
  GraphQLUnionType,
  isCompositeType,
  Kind
} from 'graphql'

import type { CursorConnectionType, OffsetConnectionType } from '../types'
import type { RelationDescriptor } from './relation.decorator'
import type { QueryResolveFields, QueryResolveTree, SelectRelation } from '@ptc-org/nestjs-query-core'
import type { GraphQLCompositeType, GraphQLResolveInfo as ResolveInfo, SelectionNode } from 'graphql'
/**
 * Parts based of https://github.com/graphile/graphile-engine/blob/master/packages/graphql-parse-resolve-info/src/index.ts
 */

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

function getDirectiveResults(fieldNode: SelectionNode, info: ResolveInfo) {
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

function inlineFragments(nodes: ReadonlyArray<SelectionNode>, resolveInfo: ResolveInfo): SelectionNode[] {
  return nodes.flatMap((ast) => {
    if (ast.kind !== Kind.FRAGMENT_SPREAD) return ast

    if (ast.directives?.length) {
      const { shouldInclude, shouldSkip } = getDirectiveResults(ast, resolveInfo)
      // field/fragment is not included if either the @skip condition is true or the @include condition is false
      // https://facebook.github.io/graphql/draft/#sec--include
      if (shouldSkip || !shouldInclude) {
        return []
      }
    }

    const fragment = resolveInfo.fragments[ast.name.value]
    if (fragment) {
      return inlineFragments(fragment.selectionSet.selections, resolveInfo)
    }
    return []
  })
}

function parseFieldNodes<DTO>(
  inASTs: ReadonlyArray<SelectionNode> | SelectionNode,
  resolveInfo: ResolveInfo,
  initTree: QueryResolveFields<DTO> | null,
  parentType: GraphQLCompositeType
): QueryResolveTree<DTO> | QueryResolveFields<DTO> {
  const asts: ReadonlyArray<SelectionNode> = Array.isArray(inASTs) ? inASTs : [inASTs]

  const astsWithInlinedFragments = inlineFragments(asts, resolveInfo)

  return astsWithInlinedFragments.reduce((tree, fieldNode) => {
    let name: string
    let alias: string

    if (fieldNode.kind === Kind.INLINE_FRAGMENT) {
      name = fieldNode?.typeCondition?.name.value
    } else {
      name = fieldNode.name.value
    }

    if (fieldNode.kind === Kind.FIELD) {
      alias = fieldNode?.alias?.value ?? name
    }

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
      name,
      alias,
      args: fieldNode.kind === Kind.FIELD ? getArgumentValues(field, fieldNode, resolveInfo.variableValues) : {},

      fields:
        fieldNode.kind !== Kind.FRAGMENT_SPREAD && fieldNode.selectionSet && isCompositeType(fieldGqlTypeOrUndefined)
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
  return parseFieldNodes<DTO>(resolveInfo.fieldNodes, resolveInfo, null, resolveInfo.parentType) as QueryResolveTree<DTO>
}

export function removePagingFromSimplifiedInfo<DTO>(simpleInfo: QueryResolveTree<DTO>) {
  if (isOffsetPaging(simpleInfo)) {
    return simpleInfo.fields.nodes as QueryResolveTree<DTO>
  } else if (isCursorPaging(simpleInfo)) {
    return simpleInfo.fields.edges.fields.node as QueryResolveTree<DTO>
  }

  return simpleInfo
}

export function createLookAheadInfo<DTO>(
  relations: RelationDescriptor<unknown>[],
  simpleResolveInfo: QueryResolveTree<DTO>
): SelectRelation<DTO>[] {
  const simplifiedInfoWithoutPaging = removePagingFromSimplifiedInfo(simpleResolveInfo)

  return relations
    .map((relation): SelectRelation<DTO> | boolean => {
      if (relation.name in simplifiedInfoWithoutPaging.fields) {
        return {
          name: relation.name,
          query: (simplifiedInfoWithoutPaging.fields[relation.name] as QueryResolveTree<DTO>).args || {}
        }
      }

      return false
    })
    .filter(Boolean) as SelectRelation<DTO>[]
}
