import { Query } from '@ptc-org/nestjs-query-core'

import { getOrCreateOffsetConnectionType } from '../../src/connection/offset/offset-connection.type'
import { Field } from '../../src/decorators'

describe('getOrCreateOffsetConnectionType', () => {
  const query = { paging: { limit: 1, offset: 0 } }

  it('omits the count query and totalCount field when total counts are disabled', async () => {
    class TestDTO {
      @Field()
      id!: number
    }

    const ConnectionType = getOrCreateOffsetConnectionType(TestDTO, {})
    const count = jest.fn().mockResolvedValue(1)
    const connection = await ConnectionType.createFromPromise(() => Promise.resolve([{ id: 1 }]), query as Query<TestDTO>, count)

    expect(count).not.toHaveBeenCalled()
    expect(connection).not.toHaveProperty('totalCount')
    expect(Reflect.getMetadata('swagger/apiModelProperties', ConnectionType.prototype, 'totalCount')).toBeUndefined()
  })

  it('queries and exposes totalCount when total counts are enabled', async () => {
    class TestDTOWithTotalCount {
      @Field()
      id!: number
    }

    const ConnectionType = getOrCreateOffsetConnectionType(TestDTOWithTotalCount, { enableTotalCount: true })
    const count = jest.fn().mockResolvedValue(1)
    const connection = await ConnectionType.createFromPromise(
      () => Promise.resolve([{ id: 1 }]),
      query as Query<TestDTOWithTotalCount>,
      count
    )

    expect(count).toHaveBeenCalledWith(undefined)
    expect(connection.totalCount).toBe(1)
    expect(Reflect.getMetadata('swagger/apiModelProperties', ConnectionType.prototype, 'totalCount')).toBeDefined()
  })
})
