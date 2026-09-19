import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { QueryService } from '@ptc-org/nestjs-query-core'
import { Transform, Type } from 'class-transformer'
import { anything, deepEqual, instance, mock, objectContaining, verify, when } from 'ts-mockito'

import { ExportResolver, ExportResolverOpts, FilterableField, Relation } from '../../src'
import { stringifyExportCsv } from '../../src/resolvers/export.resolver'
import { generateSchema, TestResolverDTO } from '../__fixtures__'

describe('stringifyExportCsv', () => {
  it.each(['=', '+', '-', '@', '\t', '\r', '\uFF1D', '\uFF0B'])('escapes values beginning with %j', (prefix) => {
    const value = `${prefix}formula()`

    expect(stringifyExportCsv([{ value }], [{ field: 'value' }])).toContain(`"'${value}"`)
  })

  it('serializes dates as ISO strings, including selected relation dates', () => {
    const date = new Date('2026-09-20T14:30:00+02:00')
    const items = [{ createdAt: date, owner: { createdAt: date }, missing: null }]

    expect(stringifyExportCsv(items, [{ field: 'createdAt' }, { field: 'owner.createdAt' }, { field: 'missing' }])).toBe(
      '"createdAt","owner.createdAt","missing"\n2026-09-20T12:30:00.000Z,2026-09-20T12:30:00.000Z,\n'
    )
  })

  it('preserves formatted date strings', () => {
    expect(stringifyExportCsv([{ date: '20/09/2026' }], [{ field: 'date' }])).toBe('"date"\n"20/09/2026"\n')
  })

  it('serializes only selected fields', () => {
    expect(stringifyExportCsv([{ id: 1, title: 'Write GraphQL documentation' }], [{ field: 'title' }])).toBe(
      '"title"\n"Write GraphQL documentation"\n'
    )
  })

  it('uses property names when labels are omitted or empty', () => {
    const fields = [{ field: 'id' }, { field: 'title', label: '' }]

    expect(stringifyExportCsv([{ id: 1, title: 'Write GraphQL documentation' }], fields)).toBe(
      '"id","title"\n1,"Write GraphQL documentation"\n'
    )
  })

  it('selects nested fields and applies column labels', () => {
    const fields = [
      { field: 'id', label: 'Identifier' },
      { field: 'owner.name', label: 'Owner' }
    ]

    expect(stringifyExportCsv([{ id: 1, owner: { name: 'Ada' } }], fields)).toBe('"Identifier","Owner"\n1,"Ada"\n')
  })

  it('reads prototype getters and values from collection relations', () => {
    class Item {
      get title(): string {
        return 'Computed'
      }

      owners = [{ name: 'Ada' }, { name: 'Grace' }]
    }

    expect(stringifyExportCsv([new Item()], [{ field: 'title' }, { field: 'owners.name' }])).toBe(
      '"title","owners.name"\n"Computed","[""Ada"",""Grace""]"\n'
    )
  })

  it('includes the requested headers when no records are returned', () => {
    expect(stringifyExportCsv([], [{ field: 'id' }, { field: 'owner.name', label: 'Owner' }])).toBe('"id","Owner"\n')
  })
})

describe('ExportResolver', () => {
  @ObjectType()
  class ExportOwnerDTO {
    @FilterableField()
    name!: string
  }

  @ObjectType()
  @Relation('owner', () => ExportOwnerDTO)
  class ExportDTO {
    @Field()
    @Transform(({ value }: { value: string }) => value.toUpperCase())
    stringField!: string

    @Type(() => ExportOwnerDTO)
    owner?: ExportOwnerDTO
  }

  const expectResolverSDL = async (opts?: ExportResolverOpts<TestResolverDTO>) => {
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends ExportResolver(TestResolverDTO, opts) {
      @Query(() => TestResolverDTO)
      test(): TestResolverDTO {
        return { id: '1', stringField: 'foo' }
      }
    }

    return generateSchema([TestSDLResolver])
  }

  it('does not create an export query by default', async () => {
    const schema = await expectResolverSDL()

    expect(schema).not.toContain('exportTestResolverDTOS(')
  })

  it('creates an export query when enabled', async () => {
    const schema = await expectResolverSDL({ enabled: true })

    expect(schema).toContain('exportTestResolverDTOS(')
    expect(schema).toContain('fields: [ExportTestResolverDTOField!]!')
    expect(schema).toContain('): String!')
  })

  it('uses the configured query name', async () => {
    const schema = await expectResolverSDL({ enabled: true, many: { name: 'downloadTests' } })

    expect(schema).toContain('downloadTests(')
    expect(schema).not.toContain('exportTestResolverDTOS(')
  })

  it('uses the separate GraphQL export DTO for the export input', async () => {
    const schema = await expectResolverSDL({ enabled: true, ExportDTOClass: ExportDTO })

    expect(schema).toContain('fields: [ExportExportDTOField!]!')
  })

  it('builds a schema when multiple resolvers share a custom export DTO', async () => {
    @Resolver(() => TestResolverDTO)
    class FirstResolver extends ExportResolver(TestResolverDTO, {
      enabled: true,
      ExportDTOClass: ExportDTO,
      many: { name: 'exportFirst' }
    }) {}

    @Resolver(() => ExportOwnerDTO)
    class SecondResolver extends ExportResolver(ExportOwnerDTO, {
      enabled: true,
      ExportDTOClass: ExportDTO,
      many: { name: 'exportSecond' }
    }) {}

    const schema = await generateSchema([FirstResolver, SecondResolver])
    expect(schema).toContain('exportFirst(')
    expect(schema).toContain('exportSecond(')
    expect(schema.match(/input ExportExportDTOField/g)).toHaveLength(1)
  })

  it('maps renamed schema fields to properties after transformation, including relation fields and getters', async () => {
    @ObjectType()
    class NamedOwner {
      @Field({ name: 'displayName' })
      name!: string
    }

    @ObjectType()
    @Relation('owner', () => NamedOwner)
    class NamedExport {
      @Field({ name: 'displayTitle' })
      @Transform(({ value }: { value: string }) => value.toUpperCase())
      title!: string

      @Field()
      get summary(): string {
        return `${this.title}!`
      }
    }

    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([
      { id: '1', stringField: 'test', title: 'hello', owner: { name: 'Ada' } } as TestResolverDTO
    ])
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, ExportDTOClass: NamedExport }))(instance(service))

    await expect(
      resolver.exportMany({}, { fields: [{ field: 'displayTitle' }, { field: 'owner.displayName' }, { field: 'summary' }] })
    ).resolves.toBe('"displayTitle","owner.displayName","summary"\n"HELLO","Ada","HELLO!"\n')
    verify(service.exportMany(objectContaining({ relations: [{ name: 'owner', query: {} }] }), anything())).once()
  })

  it.each([undefined, 25])('queries and exports records with the limit %s', async (limit) => {
    const maxRecords = limit ?? 1000
    const items = Array.from({ length: maxRecords }, (_, id) => ({ id: String(id), stringField: 'test' }))
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve(items)
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, limit }))(instance(service))

    const csv = await resolver.exportMany({}, { fields: [{ field: 'id' }] })
    expect(csv.trim().split('\n')).toHaveLength(maxRecords + 1)
    verify(service.exportMany(objectContaining({ paging: { limit: maxRecords, offset: 0 } }), anything())).once()
  })

  it('transforms GraphQL fields without Expose decorators or mutating service records', async () => {
    const items = [{ id: '1', stringField: 'test', owner: { name: 'Ada', secret: 'hidden' } }]
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve(items)
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, ExportDTOClass: ExportDTO }))(instance(service))

    await expect(
      resolver.exportMany(
        {},
        {
          fields: [
            { field: 'stringField', label: 'Value' },
            { field: 'owner.name', label: 'Owner' }
          ]
        }
      )
    ).resolves.toBe('"Value","Owner"\n"TEST","Ada"\n')
    expect(items).toEqual([{ id: '1', stringField: 'test', owner: { name: 'Ada', secret: 'hidden' } }])
  })

  it('escapes formulas produced by export DTO transformations', async () => {
    @ObjectType()
    class FormulaExportDTO {
      @Field()
      @Transform(() => '=1+1')
      stringField!: string
    }

    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ id: '1', stringField: 'test' }])
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, ExportDTOClass: FormulaExportDTO }))(instance(service))

    await expect(resolver.exportMany({}, { fields: [{ field: 'stringField' }] })).resolves.toBe('"stringField"\n"\'=1+1"\n')
  })

  it('preserves selected headers for an empty export with a separate DTO', async () => {
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([])
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, ExportDTOClass: ExportDTO }))(instance(service))

    await expect(resolver.exportMany({}, { fields: [{ field: 'stringField', label: 'Value' }] })).resolves.toBe('"Value"\n')
  })

  it('does not expose the export query when disabled', async () => {
    const schema = await expectResolverSDL({ enabled: true, disabled: true })

    expect(schema).not.toContain('exportTestResolverDTOS(')
  })

  it('exports the authorized query with the configured limit and soft-delete visibility', async () => {
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ id: '1', stringField: 'test' }])
    const resolver = new (ExportResolver(TestResolverDTO, {
      enabled: true,
      limit: 25,
      many: { withDeleted: true }
    }))(instance(service))
    const query = { filter: { stringField: { eq: 'test' } } }
    const authorizeFilter = { id: { eq: '1' } }
    const fields = [{ field: 'stringField', label: 'Value' }, { field: 'owner.company.name' }]
    const resolveInfo = {
      info: { name: 'exportTestResolverDTOS', alias: 'exportTestResolverDTOS', args: {}, fields: {} as never }
    }

    await expect(resolver.exportMany(query, { fields }, authorizeFilter, resolveInfo)).resolves.toBe(
      '"Value","owner.company.name"\n"test",\n'
    )
    verify(
      service.exportMany(
        objectContaining({
          filter: { and: [query.filter, authorizeFilter] },
          paging: { limit: 25, offset: 0 },
          relations: [
            {
              name: 'owner',
              query: { relations: [{ name: 'company', query: {} }] }
            }
          ]
        }),
        deepEqual({ withDeleted: true, resolveInfo: resolveInfo.info })
      )
    ).once()
  })
})
