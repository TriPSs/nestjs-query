import { Controller, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { QueryService, SortDirection } from '@ptc-org/nestjs-query-core'
import request from 'supertest'
import { vi } from 'vitest'

import { getAuthorizerToken } from '../../src/auth'
import { CRUDController } from '../../src/controllers/crud.controller'
import { ExportController, ExportControllerOpts } from '../../src/controllers/export.controller'
import { Field, FilterableField, IDField, QueryOptions } from '../../src/decorators'
import { createExportQueryArgs } from '../../src/types/query/query-args/export-paging-query-args.type'

describe.each(['standalone', 'CRUD'] as const)('%s exports with a list DTO', (kind) => {
  let app: INestApplication

  afterEach(() => app?.close())

  it.each(['list defaults', 'CSV override', 'query override', 'relations override'] as const)(
    'uses %s while preserving export authorization and limits',
    async (mode) => {
      @QueryOptions({ defaultSort: [{ field: 'title', direction: SortDirection.DESC }] })
      class ListItemDTO {
        @FilterableField(() => String)
        title!: string
      }

      class ListDTO extends ListItemDTO {}

      class TestDTO extends ListItemDTO {
        @IDField()
        id!: number

        @FilterableField(() => String)
        detail!: string
      }

      class CsvDTO {
        @Field(() => String)
        detail!: string
      }

      const relations = [{ name: 'assignee', query: { relations: [{ name: 'team', query: {} }] } }]
      const filter = { id: { eq: 7 } }
      const service = { exportMany: vi.fn().mockResolvedValue([{ id: 7, title: 'test', detail: 'details' }]) }
      const authorizer = { authorize: vi.fn().mockResolvedValue(filter), authorizeRelation: vi.fn() }

      const exportOpts: ExportControllerOpts<TestDTO> = {
        limit: 25,
        ExportDTOClass: mode === 'CSV override' ? CsvDTO : undefined,
        QueryArgs:
          mode === 'query override'
            ? createExportQueryArgs(TestDTO, { defaultSort: [{ field: 'detail', direction: SortDirection.ASC }] })
            : undefined,
        many: {
          withDeleted: true,
          ReturnDTOClass: kind === 'standalone' ? ListDTO : undefined,
          relations: mode === 'relations override' ? [] : kind === 'standalone' ? relations : undefined
        }
      }
      const BaseController: new (service: QueryService<TestDTO>) => object =
        kind === 'standalone'
          ? ExportController(TestDTO, exportOpts)
          : CRUDController(TestDTO, {
              read: { many: { ReturnDTOClass: ListDTO, relations } },
              export: exportOpts
            })

      @Controller('tests')
      class TestController extends BaseController {
        constructor() {
          super(service as unknown as QueryService<TestDTO>)
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [{ provide: getAuthorizerToken(TestDTO), useValue: authorizer }]
      }).compile()
      app = moduleRef.createNestApplication()
      await app.init()

      const response = await request(app.getHttpServer())
        .get('/tests/export')
        .query({ title: 'test', detail: 'details' })
        .expect(200)
      expect(response.text).toBe(mode === 'CSV override' ? '"detail"\n"details"\n' : '"title"\n"test"\n')
      expect(service.exportMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            and: [
              filter,
              mode === 'query override' ? { title: { eq: 'test' }, detail: { eq: 'details' } } : { title: { eq: 'test' } }
            ]
          },
          sorting:
            mode === 'query override'
              ? [{ field: 'detail', direction: SortDirection.ASC }]
              : [{ field: 'title', direction: SortDirection.DESC }],
          paging: { limit: 25, offset: 0 },
          relations: mode === 'relations override' ? [] : relations
        }),
        { withDeleted: true }
      )
      await request(app.getHttpServer())
        .get('/tests/export')
        .query({ sort: mode === 'query override' ? 'title:DESC' : 'detail:ASC' })
        .expect(mode === 'query override' ? 200 : 400)
      const clientSortedQuery = expect.objectContaining({ sorting: [{ field: 'title', direction: SortDirection.DESC }] })
      expect(service.exportMany.mock.calls.slice(1)).toEqual(
        mode === 'query override' ? [[clientSortedQuery, { withDeleted: true }]] : []
      )
    }
  )
})
