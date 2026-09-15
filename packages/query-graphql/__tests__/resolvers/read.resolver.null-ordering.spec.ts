import { ID, ObjectType, Resolver } from '@nestjs/graphql'
import { NullOrdering, QueryService, SortDirection } from '@ptc-org/nestjs-query-core'

import { FilterableField, KeySet } from '../../src/decorators'
import { ReadResolver } from '../../src/resolvers'

describe('ReadResolver keyset paging over a nullable sort', () => {
  @ObjectType('TestNullOrdering')
  @KeySet(['id'])
  class TestNullOrderingDTO {
    @FilterableField(() => ID)
    id!: number

    @FilterableField({ nullable: true })
    nullableField?: string
  }

  @Resolver(() => TestNullOrderingDTO)
  class TestNullOrderingResolver extends ReadResolver(TestNullOrderingDTO) {}

  const resolverBackedByAServiceReporting = (nullOrdering?: NullOrdering) => {
    const query = jest.fn().mockResolvedValue([])
    const service = {
      nullOrdering,
      query,
      count: jest.fn().mockResolvedValue(0)
    } as unknown as QueryService<TestNullOrderingDTO>
    return { query, resolver: new TestNullOrderingResolver(service) }
  }

  const cursorAtANull = Buffer.from(
    JSON.stringify({
      type: 'keyset',
      fields: [
        { field: 'nullableField', value: null },
        { field: 'id', value: 5 }
      ]
    })
  ).toString('base64')

  const pageAfterANull = {
    sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
    paging: { first: 1, after: cursorAtANull }
  }

  it('should build the boundary from the null ordering the service reports', async () => {
    const { query, resolver } = resolverBackedByAServiceReporting(NullOrdering.NULLS_SMALLEST)

    await resolver.queryMany(pageAfterANull as never)

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          or: [{ and: [{ nullableField: { isNot: null } }] }, { and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }]
        }
      }),
      expect.anything()
    )
  })

  it('should assume nulls sort largest when the service reports nothing', async () => {
    const { query, resolver } = resolverBackedByAServiceReporting()

    await resolver.queryMany(pageAfterANull as never)

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { or: [{ and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }] }
      }),
      expect.anything()
    )
  })
})
