import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { applyQuery, Class, Query as ServiceQuery, QueryService, SortDirection } from '@ptc-org/nestjs-query-core'
import { plainToInstance, Transform, Type } from 'class-transformer'
import { validateSync } from 'class-validator'
import { buildSchema, graphql } from 'graphql'
import { anything, deepEqual, instance, mock, objectContaining, verify, when } from 'ts-mockito'

import { ExportResolver, ExportResolverOpts, ExportTransform, FilterableField, Relation } from '../../src'
import { stringifyExportCsv } from '../../src/resolvers/export.resolver'
import { generateSchema, TestResolverDTO } from '../__fixtures__'

describe('stringifyExportCsv', () => {
  it.each(['=', '+', '-', '@', '\t', '\r', '\uFF1D', '\uFF0B'])('escapes values beginning with %j', async (prefix) => {
    const value = `${prefix}formula()`

    await expect(stringifyExportCsv([{ value }], [{ field: 'value' }])).resolves.toContain(`"'${value}"`)
  })

  it('serializes dates as ISO strings, including selected relation dates', async () => {
    const date = new Date('2026-09-20T14:30:00+02:00')
    const items = [{ createdAt: date, owner: { createdAt: date }, missing: null }]

    await expect(
      stringifyExportCsv(items, [{ field: 'createdAt' }, { field: 'owner.createdAt' }, { field: 'missing' }])
    ).resolves.toBe('"createdAt","owner.createdAt","missing"\n2026-09-20T12:30:00.000Z,2026-09-20T12:30:00.000Z,\n')
  })

  it('preserves formatted date strings', async () => {
    await expect(stringifyExportCsv([{ date: '20/09/2026' }], [{ field: 'date' }])).resolves.toBe('"date"\n"20/09/2026"\n')
  })

  it('serializes only selected fields', async () => {
    await expect(stringifyExportCsv([{ id: 1, title: 'Write GraphQL documentation' }], [{ field: 'title' }])).resolves.toBe(
      '"title"\n"Write GraphQL documentation"\n'
    )
  })

  it('uses property names when labels are omitted or empty', async () => {
    const fields = [{ field: 'id' }, { field: 'title', label: '' }]

    await expect(stringifyExportCsv([{ id: 1, title: 'Write GraphQL documentation' }], fields)).resolves.toBe(
      '"id","title"\n1,"Write GraphQL documentation"\n'
    )
  })

  it('selects nested fields and applies column labels', async () => {
    const fields = [
      { field: 'id', label: 'Identifier' },
      { field: 'owner.name', label: 'Owner' }
    ]

    await expect(stringifyExportCsv([{ id: 1, owner: { name: 'Ada' } }], fields)).resolves.toBe('"Identifier","Owner"\n1,"Ada"\n')
  })

  it('reads prototype getters and values from collection relations', async () => {
    class Item {
      get title(): string {
        return 'Computed'
      }

      owners = [{ name: 'Ada' }, { name: 'Grace' }]
    }

    await expect(stringifyExportCsv([new Item()], [{ field: 'title' }, { field: 'owners.name' }])).resolves.toBe(
      '"title","owners.name"\n"Computed","[""Ada"",""Grace""]"\n'
    )
  })

  it('includes the requested headers when no records are returned', async () => {
    await expect(stringifyExportCsv([], [{ field: 'id' }, { field: 'owner.name', label: 'Owner' }])).resolves.toBe(
      '"id","Owner"\n'
    )
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
    expect(schema).toContain('paging: OffsetPaging! = {limit: 1000}')
    expect(schema).toContain('): String!')
  })

  it('uses the configured export maximum as the paging default', async () => {
    const schema = await expectResolverSDL({ enabled: true, limit: 25 })

    expect(schema).toContain('paging: OffsetPaging! = {limit: 25}')
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

  it.each([undefined, 25])('applies the GraphQL paging default for export limit %s', async (limit) => {
    const maxRecords = limit ?? 1000
    const items = Array.from({ length: maxRecords }, (_, id) => ({ id: String(id), stringField: 'test' }))
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve(items)
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, limit }))(instance(service))

    const schema = buildSchema(await expectResolverSDL({ enabled: true, limit }))
    const result = await graphql({
      schema,
      source: '{ exportTestResolverDTOS(fields: [{ field: "id" }]) }',
      rootValue: {
        exportTestResolverDTOS: ({ fields, ...query }: ServiceQuery<TestResolverDTO> & { fields: { field: string }[] }) =>
          resolver.exportMany(query, { fields })
      }
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.exportTestResolverDTOS).toBe(items.reduce((csv, item) => `${csv}"${item.id}"\n`, '"id"\n'))
    verify(service.exportMany(objectContaining({ paging: { limit: maxRecords } }), anything())).once()
  })

  it.each([
    { maximum: undefined, paging: { limit: 10 } },
    { maximum: 25, paging: { limit: 10, offset: 20 } },
    { maximum: 25, paging: { limit: 25, offset: 50 } },
    { maximum: undefined, paging: { limit: 1000, offset: 100 } }
  ])('passes requested export paging to the service %j', async ({ maximum, paging }) => {
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([])
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true, limit: maximum }))(instance(service))

    await resolver.exportMany({ paging }, { fields: [{ field: 'id' }] })

    verify(service.exportMany(objectContaining({ paging }), anything())).once()
  })

  it.each([undefined, 25])('validates the configured export maximum %s', (limit) => {
    const ResolverClass = ExportResolver(TestResolverDTO, { enabled: true, limit })
    const [QueryArgs] = Reflect.getMetadata('design:paramtypes', ResolverClass.prototype, 'exportMany') as [
      Class<ServiceQuery<TestResolverDTO>>
    ]
    const maximum = limit ?? 1000

    expect(validateSync(plainToInstance(QueryArgs, { paging: { limit: maximum, offset: 0 } }))).toHaveLength(0)
    expect(validateSync(plainToInstance(QueryArgs, { paging: { limit: maximum + 1, offset: 0 } }))).toEqual([
      expect.objectContaining({
        property: 'paging',
        constraints: { PropertyMax: `Field paging.limit max allowed value is \`${maximum}\`.` }
      })
    ])
  })

  it('exports a page of filtered and authorized records in the requested order', async () => {
    const items = Array.from({ length: 10 }, (_, id) => ({ id: String(id), stringField: 'test' }))
    const service = mock<QueryService<TestResolverDTO>>()
    when(service.exportMany(anything(), anything())).thenCall((query: ServiceQuery<TestResolverDTO>) =>
      Promise.resolve(applyQuery(items, query))
    )
    const resolver = new (ExportResolver(TestResolverDTO, { enabled: true }))(instance(service))

    await expect(
      resolver.exportMany(
        {
          filter: { id: { gte: '2' } },
          sorting: [{ field: 'id', direction: SortDirection.DESC }],
          paging: { limit: 2, offset: 2 }
        },
        { fields: [{ field: 'id' }] },
        { id: { lte: '7' } }
      )
    ).resolves.toBe('"id"\n"5"\n"4"\n')
  })

  it.each([false, true])('applies export-only transforms with a separate DTO: %s', async (separate) => {
    @ObjectType()
    class ExportOnlyDTO {
      @FilterableField()
      @ExportTransform(({ value }: { value: string }) => `=${value.toUpperCase()}`)
      stringField!: string
    }

    const item = plainToInstance(ExportOnlyDTO, { stringField: 'test' })
    const service = mock<QueryService<ExportOnlyDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([item])
    const resolver = new (ExportResolver<ExportOnlyDTO>(separate ? TestResolverDTO : ExportOnlyDTO, {
      enabled: true,
      ExportDTOClass: separate ? ExportOnlyDTO : undefined
    }))(instance(service))

    await expect(resolver.exportMany({}, { fields: [{ field: 'stringField' }] })).resolves.toBe('"stringField"\n"\'=TEST"\n')
    expect(item.stringField).toBe('test')
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
    const query = { filter: { stringField: { eq: 'test' } }, paging: { limit: 25, offset: 0 } }
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
