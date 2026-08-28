import { Filter } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { FilterableField } from '../../../src/decorators'
import { FilterType } from '../../../src/types/query/filter.type'

jest.mock('@nestjs/swagger/dist/plugin/plugin-constants', () => ({
  METADATA_FACTORY_NAME: 'OPENAPI_METADATA_FACTORY'
}))

describe('FilterType', () => {
  class QueryArgs {
    public get filter(): Filter<unknown> {
      return {}
    }
  }

  it('initializes fields decorated with FilterableField without options', () => {
    class TestDto {
      @FilterableField()
      completed!: boolean
    }

    expect(() => FilterType(TestDto, QueryArgs)).not.toThrow()
  })

  it.each([
    ['completed', 'false', false],
    ['priority', '0', 0]
  ])('creates an equality filter for %s=%s', (field, queryValue, value) => {
    class TestDto {
      @FilterableField()
      completed!: boolean

      @FilterableField()
      priority!: number
    }

    const QueryFilter = FilterType(TestDto, QueryArgs)
    const query = plainToInstance(QueryFilter, { [field]: queryValue }) as unknown as { filter: Filter<TestDto> }

    expect(query.filter).toEqual({ [field]: { eq: value } })
  })
})
