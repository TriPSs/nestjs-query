import { Filter } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { FilterableField } from '../../../src/decorators'
import { BuildableQueryType } from '../../../src/types/query/buildable-query.type'
import { createOffsetQueryArgs } from '../../../src/types/query/query-args/offset-query-args.type'

describe('createOffsetQueryArgs', () => {
  class TestDTO {
    @FilterableField()
    title!: string
  }

  it('retains the default filter and omits filter fields when filtering is disabled', () => {
    const defaultFilter: Filter<TestDTO> = { title: { eq: 'default' } }
    const QueryArgs = createOffsetQueryArgs(TestDTO, { disableFilter: true, defaultFilter })
    const query = plainToInstance(QueryArgs, { title: 'override' }) as unknown as BuildableQueryType<TestDTO>

    expect(query.buildQuery().filter).toEqual(defaultFilter)
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'title')).toBeUndefined()
  })

  it.each([
    ['a lower limit', 5, 6, 1],
    ['a higher limit', 100, 75, 0]
  ])('validates %s from the endpoint options', (_description, maxResultsSize, limit, errorCount) => {
    class PagingDTO {}

    const QueryArgs = createOffsetQueryArgs(PagingDTO, { maxResultsSize })
    const query = plainToInstance(QueryArgs, { limit })

    expect(validateSync(query)).toHaveLength(errorCount)
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'limit')?.maximum).toBe(maxResultsSize)
  })

  it('uses the default result size when only a maximum is configured', () => {
    class PagingDTO {}

    const QueryArgs = createOffsetQueryArgs(PagingDTO, { maxResultsSize: 100 })
    const query = plainToInstance(QueryArgs, {}) as unknown as BuildableQueryType<PagingDTO>

    expect(query.buildQuery().paging?.limit).toBe(25)
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'limit')?.default).toBe(25)
  })
})
