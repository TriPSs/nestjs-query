import { Query, Selection, SelectionWithArgs } from '@ptc-org/nestjs-query-core'
import { SelectRelation } from '@ptc-org/nestjs-query-core/src/interfaces/select-relation.interface'
import { CursorConnectionType, OffsetConnectionType } from '@ptc-org/nestjs-query-graphql'
import { RelationDescriptor } from '@ptc-org/nestjs-query-graphql/src/decorators/relation.decorator'
import {
  ASTNode,
  DirectiveNode,
  FieldNode,
  getArgumentValues,
  getNamedType,
  GraphQLCompositeType,
  GraphQLField,
  GraphQLResolveInfo as ResolveInfo,
  GraphQLUnionType,
  isCompositeType,
  Kind,
  SelectionNode,
  FragmentDefinitionNode,
  GraphQLNamedType,
  GraphQLResolveInfo,
  InlineFragmentNode,
  NamedTypeNode
} from 'graphql'
import merge from 'lodash.merge'

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
): GraphQLField<GraphQLCompositeType, TContext> | GraphQLField<GraphQLCompositeType, TContext>[] | undefined {
  if (fieldNode.kind === Kind.FIELD) {
    if (!(parentType instanceof GraphQLUnionType)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return parentType.getFields()[fieldNode.name.value]
    } else {
      const fieldByType = []
      const unionTypes = parentType.getTypes()
      unionTypes.forEach((type) => {
        const resolvedType = getFieldFromAST<TContext>(fieldNode, type)
        if (resolvedType) {
          fieldByType.push(resolvedType)
          fieldByType.flat()
        }
      })

      return fieldByType
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

function getType(resolveInfo: GraphQLResolveInfo, typeCondition: NamedTypeNode) {
  const { schema } = resolveInfo
  const { kind, name } = typeCondition
  if (kind === Kind.NAMED_TYPE) {
    const typeName = name.value
    return schema.getType(typeName)
  }
}

export function parseFieldNodes<DTO>(
  inASTs: ReadonlyArray<SelectionNode> | SelectionNode,
  resolveInfo: ResolveInfo,
  initTree: QueryResolveFields<DTO> | null,
  parentType: GraphQLCompositeType
): QueryResolveTree<DTO> | QueryResolveFields<DTO> {
  const fragments = resolveInfo.fragments || {}
  const asts: ReadonlyArray<FieldNode> = Array.isArray(inASTs) ? inASTs : [inASTs]

  return asts.reduce((tree, fieldNode) => {
    if (fieldNode.kind === Kind.FIELD) {
      const alias: string = fieldNode?.alias?.value ?? fieldNode.name.value

      const fieldOrUnionFields = getFieldFromAST(fieldNode, parentType)
      const field = (Array.isArray(fieldOrUnionFields) ? fieldOrUnionFields : [fieldOrUnionFields]).reduce(
        (fieldMap, fieldByType) => merge(fieldMap, fieldByType),
        {}
      ) as GraphQLField<GraphQLCompositeType, any>
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
    } else {
      let fragment = fieldNode as unknown as FragmentDefinitionNode | InlineFragmentNode

      if (fieldNode.kind === Kind.FRAGMENT_SPREAD) {
        const name = fieldNode.name?.value
        fragment = fragments[name]
      }

      let fragmentType: GraphQLNamedType | null | undefined = parentType

      if (fragment.typeCondition) {
        fragmentType = getType(resolveInfo, fragment.typeCondition)
      }

      if (fragmentType && isCompositeType(fragmentType)) {
        const newParentType: GraphQLCompositeType = fragmentType
        parseFieldNodes(fragment.selectionSet.selections, resolveInfo, tree, newParentType)
      }
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

type CnxKeys = keyof OffsetConnectionType<undefined> | keyof CursorConnectionType<undefined>

function parseResolveInfo<DTO>(
  inASTs: ReadonlyArray<SelectionNode> | SelectionNode,
  resolveInfo: ResolveInfo,
  initTree: Selection<DTO> | null,
  parentType: GraphQLCompositeType,
  isConnectionTypeFn: (type: GraphQLCompositeType) => boolean
): Selection<DTO> {
  const fragments = resolveInfo.fragments || {}
  const asts: ReadonlyArray<SelectionNode> = Array.isArray(inASTs) ? inASTs : [inASTs]

  return asts.reduce((tree, fieldNode) => {
    let map = {} as Selection<DTO>
    let mapInner: () => typeof map = () => map
    let updateMapInner: (m: typeof map) => typeof map = (m) => (map = m)

    if (fieldNode.kind === Kind.FIELD) {
      const fieldOrUnionFields = getFieldFromAST(fieldNode, parentType)
      const field = (Array.isArray(fieldOrUnionFields) ? fieldOrUnionFields : [fieldOrUnionFields]).reduce(
        (fieldMap, fieldByType) => merge(fieldMap, fieldByType),
        {}
      ) as GraphQLField<GraphQLCompositeType, any>

      const fieldName: string = fieldNode.name.value

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

      let parsedField = mapInner()

      const alias: string = fieldNode.alias?.value ?? fieldName
      const args = getArgumentValues(field, fieldNode, resolveInfo.variableValues)

      // If we have field aliases => move the creation to the alias prop
      if (fieldName !== alias) {
        map.$aliases = { [alias]: {} }
        mapInner = () => map.$aliases[alias] as Selection<DTO>
        updateMapInner = (m) => (map.$aliases[alias] = m)
      }

      if (Object.keys(args || {}).length > 0) {
        ;(mapInner() as SelectionWithArgs<DTO>).$args = args as Record<string, object>
      }

      if (fieldNode.selectionSet && isCompositeType(fieldGqlTypeOrUndefined)) {
        parsedField = parseResolveInfo(
          fieldNode.selectionSet.selections,
          resolveInfo,
          mapInner(),
          fieldGqlTypeOrUndefined,
          isConnectionTypeFn
        )
      } else {
        parsedField = { $exists: true } as Selection<DTO>
      }

      updateMapInner(parsedField)

      if (tree === null) {
        return map
      } else if (isConnectionTypeFn(parentType)) {
        // simplify Connection types
        let fields = {}
        const key = fieldName as CnxKeys

        switch (key) {
          case 'edges': // isCursorPagingObj
            fields = (map as any).node as Selection<DTO>
            break

          case 'nodes': // isOffsetPagingObj
            fields = map
            break

          case 'totalCount':
            fields = { $totalCount: { $exists: true } }
            break

          case 'pageInfo':
            fields = { $pageInfo: map }
            break

          default:
            fields = map
            break
        }

        merge(tree, fields)
      } else {
        tree[fieldName] = merge(tree[fieldName], map)
      }
      return tree
    } else {
      let fragment = fieldNode as FragmentDefinitionNode | InlineFragmentNode

      if (fieldNode.kind === Kind.FRAGMENT_SPREAD) {
        const name = fieldNode.name?.value
        fragment = fragments[name]
      }

      let fragmentType: GraphQLNamedType | null | undefined = parentType

      if (fragment.typeCondition) {
        fragmentType = getType(resolveInfo, fragment.typeCondition)
      }

      if (fragmentType && isCompositeType(fragmentType)) {
        const newParentType: GraphQLCompositeType = fragmentType
        map = parseResolveInfo(fragment.selectionSet.selections, resolveInfo, tree, newParentType, isConnectionTypeFn)
        merge(tree, map)
      }
      return tree
    }
  }, initTree)
}

export function convertToSelectionInfo<DTO>(
  resolveInfo: ResolveInfo,
  isCnxTypeFn = (t: GraphQLCompositeType) => t.name.includes('Connection')
): Selection<DTO> {
  const simpleInfo = parseResolveInfo<DTO>(resolveInfo.fieldNodes, resolveInfo, null, resolveInfo.parentType, isCnxTypeFn)

  return simpleInfo as Selection<DTO>
}
