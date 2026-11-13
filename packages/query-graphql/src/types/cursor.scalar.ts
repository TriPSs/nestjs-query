import { GraphQLScalarType, Kind, ValueNode } from 'graphql'

export type ConnectionCursorType = string

export const ConnectionCursorScalar = new GraphQLScalarType({
  name: 'ConnectionCursor',
  description: 'Cursor for paging through collections',
  parseValue(value: unknown): string {
    if (typeof value !== 'string') throw new TypeError('ConnectionCursor must be a string')
    return value
  },
  serialize(value: unknown): string {
    if (typeof value !== 'string') throw new TypeError('ConnectionCursor must be a string')
    return value
  },
  parseLiteral(ast: ValueNode): string | null {
    if (ast.kind === Kind.STRING) {
      return ast.value
    }
    return null
  }
})
