import { QueryResolveTree } from '@ptc-org/nestjs-query-core'
import { buildSchema, graphql, GraphQLResolveInfo } from 'graphql'

import { simplifyResolveInfo } from '../../src/decorators/graphql-resolve-info.utils'

describe('simplifyResolveInfo', () => {
  const schema = buildSchema('type Query { item: Item } type Item { value: String }')

  async function resolve(source: string, variableValues?: Record<string, unknown>) {
    let tree: QueryResolveTree<{ value: string }> | undefined
    const result = await graphql({
      schema,
      source,
      variableValues,
      rootValue: {
        item: (_args: unknown, _context: unknown, info: GraphQLResolveInfo) => {
          tree = simplifyResolveInfo(info)
          return { value: 'value' }
        }
      }
    })
    expect(result.errors).toBeUndefined()
    return tree
  }

  it('preserves aliases when a field has no directives', async () => {
    const tree = await resolve('{ item { aliasValue: value } }')
    expect(tree?.fields).toHaveProperty('aliasValue', {
      name: 'value',
      alias: 'aliasValue',
      args: {},
      fields: {}
    })
  })

  it('applies variable include directives and literal skip directives', async () => {
    const tree = await resolve(
      'query ($include: Boolean!) { item { included: value @include(if: $include) skipped: value @skip(if: true) } }',
      { include: true }
    )
    expect(tree?.fields).toHaveProperty('included')
    expect(tree?.fields).not.toHaveProperty('skipped')
  })

  it('omits fields when their include variable is false', async () => {
    const tree = await resolve('query ($include: Boolean!) { item { included: value @include(if: $include) } }', {
      include: false
    })
    expect(tree?.fields).toEqual({})
  })
})
