import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { SortDirection, SortNulls } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { Field, FilterableField } from '../../../src/decorators'
import { BuildableQueryType } from '../../../src/types/query/buildable-query.type'
import { createExportQueryArgs } from '../../../src/types/query/query-args/export-paging-query-args.type'
import { createNonePagingQueryArgs } from '../../../src/types/query/query-args/none-paging-query-args.type'
import { createOffsetQueryArgs } from '../../../src/types/query/query-args/offset-query-args.type'

describe.each([
  ['offset', createOffsetQueryArgs],
  ['unpaged', createNonePagingQueryArgs],
  ['export', createExportQueryArgs]
] as const)('%s sorting', (_name, createArgs) => {
  function createDTO() {
    class BaseDTO {
      @FilterableField(() => Number)
      id!: number
    }

    class TestDTO extends BaseDTO {
      @FilterableField(() => String)
      title!: string

      @Field(() => String)
      hidden!: string
    }

    return TestDTO
  }

  it('transforms a single HTTP query parameter and replaces the default sort', async () => {
    const QueryArgs = createArgs(createDTO(), { defaultSort: [{ field: 'id', direction: SortDirection.ASC }] })
    const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })
    const query = (await pipe.transform({ sort: 'title:DESC' }, { type: 'query', metatype: QueryArgs })) as BuildableQueryType<{
      title: string
    }>

    expect(query.buildQuery().sorting).toEqual([{ field: 'title', direction: SortDirection.DESC }])
  })

  it('preserves repeated parameter order, inherited fields and null ordering', () => {
    const QueryArgs = createArgs(createDTO())
    const query = plainToInstance(
      QueryArgs,
      { sort: ['title:ASC:NULLS_LAST', 'id:DESC:NULLS_FIRST'], title: 'test' },
      { excludeExtraneousValues: true }
    )

    expect(validateSync(query)).toHaveLength(0)
    expect((query as unknown as BuildableQueryType<unknown>).buildQuery()).toMatchObject({
      sorting: [
        { field: 'title', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST },
        { field: 'id', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }
      ],
      filter: { title: { eq: 'test' } }
    })
  })

  it.each(['hidden:ASC', 'unknown:ASC', 'title', 'title:asc', 'title:ASC:bad', 'title:ASC:NULLS_LAST:extra', '', {}, null, []])(
    'rejects invalid sort %j',
    (sort) => {
      const QueryArgs = createArgs(createDTO())
      const query = plainToInstance(QueryArgs, { sort }, { excludeExtraneousValues: true })

      // buildQuery also rejects invalid input when an application does not install ValidationPipe.
      expect(() => (query as unknown as BuildableQueryType<unknown>).buildQuery()).toThrow(BadRequestException)
      expect(validateSync(query).length).toBeGreaterThan(0)
    }
  )

  it('rejects non-filterable fields through ValidationPipe', async () => {
    const QueryArgs = createArgs(createDTO())
    const pipe = new ValidationPipe({ transform: true })

    await expect(pipe.transform({ sort: 'hidden:ASC' }, { type: 'query', metatype: QueryArgs })).rejects.toThrow(
      BadRequestException
    )
  })

  it('uses server defaults when sorting is omitted, including non-filterable fields', () => {
    const defaultSort = [{ field: 'hidden' as const, direction: SortDirection.ASC }]
    const QueryArgs = createArgs(createDTO(), { defaultSort })
    const query = plainToInstance(QueryArgs, {}, { excludeExtraneousValues: true })

    expect((query as unknown as BuildableQueryType<unknown>).buildQuery().sorting).toEqual(defaultSort)
  })

  it('uses an empty sort list when neither client sorting nor defaults are provided', () => {
    const QueryArgs = createArgs(createDTO())
    const query = plainToInstance(QueryArgs, {}, { excludeExtraneousValues: true })

    expect((query as unknown as BuildableQueryType<unknown>).buildQuery().sorting).toEqual([])
  })

  it('keeps the default and omits the input metadata when sorting is disabled', () => {
    const defaultSort = [{ field: 'id' as const, direction: SortDirection.ASC }]
    const QueryArgs = createArgs(createDTO(), { disableSort: true, defaultSort })
    const query = plainToInstance(QueryArgs, { sort: 'title:DESC' }, { excludeExtraneousValues: true })

    expect((query as unknown as BuildableQueryType<unknown>).buildQuery().sorting).toEqual(defaultSort)
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'sort')).toBeUndefined()
  })

  it.each([true, false])(
    'omits sorting when no fields are filterable (excludeExtraneousValues: %s)',
    (excludeExtraneousValues) => {
      class UnsortableDTO {
        @Field(() => String)
        title!: string
      }

      const defaultSort = [{ field: 'title' as const, direction: SortDirection.ASC }]
      const QueryArgs = createArgs(UnsortableDTO, { defaultSort })
      const query = plainToInstance(QueryArgs, { sort: 'title:DESC' }, { excludeExtraneousValues })

      expect((query as unknown as BuildableQueryType<unknown>).buildQuery().sorting).toEqual(defaultSort)
      expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'sort')).toBeUndefined()
    }
  )

  it('uses exposed sort names while returning the underlying property', () => {
    class AliasedDTO {
      @FilterableField(() => String, { name: 'state' })
      status!: string
    }

    const QueryArgs = createArgs(AliasedDTO)
    const query = plainToInstance(QueryArgs, { sort: 'state:ASC:NULLS_LAST' }, { excludeExtraneousValues: true })
    const metadata = Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'sort') as {
      items: { enum: string[] }
    }

    expect(validateSync(query)).toHaveLength(0)
    expect((query as unknown as BuildableQueryType<AliasedDTO>).buildQuery().sorting).toEqual([
      { field: 'status', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }
    ])
    expect(metadata.items.enum).toContain('state:ASC')
    expect(metadata.items.enum).not.toContain('status:ASC')
    expect(validateSync(plainToInstance(QueryArgs, { sort: 'status:ASC' })).length).toBeGreaterThan(0)
  })

  it.each([undefined, 'rank'])('preserves inherited filters named sort with exposed name %s', (name) => {
    class BaseDTO {
      @FilterableField(() => Number, { name })
      sort!: number
    }

    class SortFilterDTO extends BaseDTO {
      @FilterableField(() => String)
      title!: string
    }

    const defaultSort = [{ field: 'title' as const, direction: SortDirection.ASC }]
    const QueryArgs = createArgs(SortFilterDTO, { defaultSort })
    const query = plainToInstance(QueryArgs, { [name ?? 'sort']: '5' }, { excludeExtraneousValues: true })

    expect(validateSync(query)).toHaveLength(0)
    expect((query as unknown as BuildableQueryType<SortFilterDTO>).buildQuery()).toMatchObject({
      filter: { sort: { eq: 5 } },
      sorting: defaultSort
    })
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'sort')).toMatchObject({ type: Number })
  })

  it('preserves filters exposed as sort without adding sorting metadata', () => {
    class SortAliasDTO {
      @FilterableField(() => Number, { name: 'sort' })
      rank!: number
    }

    const defaultSort = [{ field: 'rank' as const, direction: SortDirection.DESC }]
    const QueryArgs = createArgs(SortAliasDTO, { defaultSort })
    const query = plainToInstance(QueryArgs, { sort: '5' }, { excludeExtraneousValues: true })

    expect(validateSync(query)).toHaveLength(0)
    expect((query as unknown as BuildableQueryType<SortAliasDTO>).buildQuery()).toMatchObject({
      filter: { rank: { eq: 5 } },
      sorting: defaultSort
    })
    expect(Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'sort')).toBeUndefined()
  })

  it('exposes allowed sort values in OpenAPI', () => {
    const QueryArgs = createArgs(createDTO())
    const metadata = Reflect.getMetadata('swagger/apiModelProperties', QueryArgs.prototype, 'sort') as {
      items: { enum: string[] }
    }

    expect(metadata.items.enum).toContain('title:ASC')
    expect(metadata.items.enum).toContain('id:DESC')
    expect(metadata.items.enum).not.toContain('hidden:ASC')
  })
})
