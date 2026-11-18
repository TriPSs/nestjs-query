import { ValidationPipe } from '@nestjs/common'
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

  describe.each([false, true])('pagination with disableFilter=%s', (disableFilter) => {
    it.each(['limit', 'offset'])('rejects fractional %s query parameters with HTTP 400', async (field) => {
      const QueryArgs = createOffsetQueryArgs(TestDTO, { disableFilter })
      const pipe = new ValidationPipe({ transform: true })
      const input = { limit: '1', offset: '0', [field]: field === 'limit' ? '1.5' : '0.5' }

      expect(validateSync(plainToInstance(QueryArgs, input))[0]?.constraints).toHaveProperty('isInt')
      await expect(pipe.transform(input, { type: 'query', metatype: QueryArgs })).rejects.toMatchObject({
        status: 400
      })
    })

    it.each([
      ['1', '0'],
      ['100', '50']
    ])('accepts and transforms integer limit=%s and offset=%s', async (limit, offset) => {
      const QueryArgs = createOffsetQueryArgs(TestDTO, { disableFilter })
      const pipe = new ValidationPipe({ transform: true })
      const query = (await pipe.transform(
        { limit, offset },
        { type: 'query', metatype: QueryArgs }
      )) as BuildableQueryType<TestDTO>

      expect(query.buildQuery().paging).toEqual({ limit: Number(limit), offset: Number(offset) })
    })

    it('describes both pagination parameters as integers in OpenAPI', () => {
      const QueryArgs = createOffsetQueryArgs(TestDTO, { disableFilter })

      for (const field of ['limit', 'offset']) {
        expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, field)?.type).toBe('integer')
      }
    })
  })

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

  it.each([undefined, {}])('defaults the maximum to 100 with options %j', (opts) => {
    class PagingDTO {}

    const QueryArgs = createOffsetQueryArgs(PagingDTO, opts)

    expect(validateSync(plainToInstance(QueryArgs, { limit: 100 }))).toHaveLength(0)
    expect(validateSync(plainToInstance(QueryArgs, { limit: 101 }))[0]?.constraints).toHaveProperty('max')
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'limit')?.maximum).toBe(100)
    const query = plainToInstance(QueryArgs, {}) as unknown as BuildableQueryType<PagingDTO>
    expect(query.buildQuery().paging?.limit).toBe(25)
  })

  it('uses the default result size when only a maximum is configured', () => {
    class PagingDTO {}

    const QueryArgs = createOffsetQueryArgs(PagingDTO, { maxResultsSize: 100 })
    const query = plainToInstance(QueryArgs, {}) as unknown as BuildableQueryType<PagingDTO>

    expect(query.buildQuery().paging?.limit).toBe(25)
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'limit')?.default).toBe(25)
  })
})
