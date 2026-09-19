import { Query, Resolver } from '@nestjs/graphql'
import { QueryService } from '@ptc-org/nestjs-query-core'
import { anything, deepEqual, instance, mock, objectContaining, verify, when } from 'ts-mockito'

import { ExportResolver, ExportResolverOpts } from '../../src'
import { stringifyExportCsv } from '../../src/resolvers/export.resolver'
import { generateSchema, TestResolverDTO } from '../__fixtures__'

describe('stringifyExportCsv', () => {
  it.each(['=', '+', '-', '@', '\t', '\r', '\uFF1D', '\uFF0B'])('escapes values beginning with %j', (prefix) => {
    const value = `${prefix}formula()`

    expect(stringifyExportCsv([{ value }], [{ field: 'value' }])).toContain(`"'${value}"`)
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

  it('includes the requested headers when no records are returned', () => {
    expect(stringifyExportCsv([], [{ field: 'id' }, { field: 'owner.name', label: 'Owner' }])).toBe('"id","Owner"\n')
  })
})

describe('ExportResolver', () => {
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
