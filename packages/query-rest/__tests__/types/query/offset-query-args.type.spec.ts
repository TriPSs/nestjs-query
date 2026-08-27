import { Filter } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

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
})
