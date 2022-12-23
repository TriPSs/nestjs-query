import { Kind } from 'graphql'
import { ArgumentNode, FieldNode, ValueNode } from 'graphql/language/ast'

import type { CursorConnectionType, OffsetConnectionType } from '../types'
import type { Query } from '@ptc-org/nestjs-query-core'
import type { GraphQLResolveInfo as ResolveInfo } from 'graphql'

export interface QueryResolveTree<DTO> {
  name: string
  alias: string
  args?: Query<DTO>
  fieldsByTypeName: {
    [key in keyof DTO]: QueryResolveTree<
      // If the key is a array get the type of the array
      DTO[key] extends ArrayLike<any> ? DTO[key][number] : DTO[key]
    >
  }
}

const parseNode = (argument: ValueNode): unknown => {
  switch (argument.kind) {
    case Kind.OBJECT:
      return argument.fields.reduce((a, b) => {
        a[b.name.value] = parseNode(b.value)
        return a
      }, {})

    case Kind.INT:
      return parseInt(argument.value, 10)

    case Kind.FLOAT:
      return parseFloat(argument.value)

    case Kind.BOOLEAN:
      return argument.value

    case Kind.STRING:
    case Kind.ENUM:
      return argument.value

    case Kind.NULL:
      return null

    case Kind.LIST:
      return argument.values.map(parseNode)

    default:
      return undefined
  }
}
const parseArgs = (args: object, argument: Readonly<ArgumentNode>) => {
  args[argument.name.value] = parseNode(argument.value)

  return args
}

const getFields = (fields: object, node: FieldNode): unknown => {
  if (fields === null) {
    fields = {
      name: node.name.value,
      args: node.arguments.reduce(parseArgs, {}),
      fieldsByTypeName:
        node.selectionSet && node.selectionSet.selections.length > 0 ? node.selectionSet.selections.reduce(getFields, {}) : {}
    }
  } else {
    fields[node.name.value] = {
      name: node.name.value,
      args: node.arguments.reduce(parseArgs, {}),
      fieldsByTypeName:
        node.selectionSet && node.selectionSet.selections.length > 0 ? node.selectionSet.selections.reduce(getFields, {}) : {}
    }
  }

  return fields
}

function isOffsetPaging<DTO>(info: unknown): info is QueryResolveTree<OffsetConnectionType<DTO>> {
  return (info as QueryResolveTree<OffsetConnectionType<DTO>>).name === 'nodes'
}

function isCursorPaging<DTO>(info: unknown): info is QueryResolveTree<CursorConnectionType<DTO>> {
  return typeof (info as QueryResolveTree<CursorConnectionType<DTO>>).fieldsByTypeName.edges !== 'undefined'
}

export function simplifyResolveInfo<DTO>(resolveInfo: ResolveInfo): QueryResolveTree<DTO> {
  const simpleInfo = resolveInfo.fieldNodes.reduce(getFields, null) as
    | QueryResolveTree<DTO>
    | QueryResolveTree<OffsetConnectionType<DTO>>
    | QueryResolveTree<CursorConnectionType<DTO>>

  if (isOffsetPaging(simpleInfo)) {
    return simpleInfo.fieldsByTypeName.nodes as QueryResolveTree<DTO>
  } else if (isCursorPaging(simpleInfo)) {
    return simpleInfo.fieldsByTypeName.edges.fieldsByTypeName.node as QueryResolveTree<DTO>
  }

  return simpleInfo as QueryResolveTree<DTO>
}
